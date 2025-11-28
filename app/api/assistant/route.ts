export const runtime = 'nodejs'
import { NextResponse } from "next/server"
import axios from "axios"
import { PDFDocument, StandardFonts } from "pdf-lib"
import fs from "fs"
import path from "path"

type Req = { transcript: string; sessionId?: string }

export async function POST(req: Request) {
  try {
    const body: Req = await req.json()
    const transcript = (body.transcript || "").trim()
    const sessionId = body.sessionId ?? `session`
    if (!transcript) return NextResponse.json({ error: "Empty transcript" }, { status: 400 })

    const systemPrompt = `
You are a medical triage assistant. Output ONLY JSON matching this schema EXACTLY:
{
  "replyText": "Understood.",
  "diagnosis": "<brief probable diagnosis or 'unknown'>",
  "symptoms": ["symptom1","symptom2", ...],
  "severity": "mild|moderate|severe|unknown",
  "recommendedActions": ["action1","action2", ...],
  "escalate": true|false,
  "recommendedSpecialist": "e.g. Emergency / General Practitioner / ENT / Dermatologist / ...",
  "prescription": {
     "recommended_medications": [
       { "name":"<drug name or placeholder>", "dose":"<dose placeholder>", "duration":"<duration placeholder>", "notes":"<notes>" }
     ],
     "notes_for_clinician":"<free text>"
  }
}
Respond ONLY with JSON and nothing else.
`

    let resp
    try {
      resp = await axios.post(process.env.OPEN_ROUTER_API_URL || "https://api.openrouter.ai/v1/chat/completions", {
        model: process.env.OPEN_ROUTER_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript }
        ],
        max_tokens: 700
      }, {
        headers: {
          Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 20000
      })
    } catch (err: any) {
      console.error("LLM network error:", err?.code ?? err?.message ?? err)

      // Offline fallback: generate a conservative triage + prescription so app can continue working
      const textLower = transcript.toLowerCase()
      const inferred = ((): any => {
        if (textLower.includes("headache")) {
          return {
            diagnosis: "Tension-type headache",
            symptoms: ["headache"],
            severity: "mild",
            med: { name: "Ibuprofen", dose: "400 mg", duration: "3 days", notes: "Take with food" },
            specialist: "Neurologist"
          }
        }
        if (textLower.includes("fever") || textLower.includes("temperature")) {
          return {
            diagnosis: "Likely viral fever",
            symptoms: ["fever"],
            severity: "moderate",
            med: { name: "Paracetamol", dose: "500 mg", duration: "3 days", notes: "Every 6-8 hours as needed" },
            specialist: "General Physician"
          }
        }
        if (textLower.includes("cough") || textLower.includes("cold")) {
          return {
            diagnosis: "Upper respiratory infection / common cold",
            symptoms: ["cough", "runny nose"],
            severity: "mild",
            med: { name: "Loratadine", dose: "10 mg", duration: "5 days", notes: "Once daily" },
            specialist: "General Physician"
          }
        }
        // default fallback
        return {
          diagnosis: "Unknown - needs clinical review",
          symptoms: [transcript],
          severity: "unknown",
          med: { name: "Paracetamol", dose: "500 mg", duration: "3 days", notes: "If symptomatic" },
          specialist: "General Physician"
        }
      })()

      const fallbackResult = {
        replyText: `Unable to reach AI service. Based on what you said, I suggest: ${inferred.diagnosis}. Recommended medicine: ${inferred.med.name}.`,
        diagnosis: inferred.diagnosis,
        symptoms: inferred.symptoms,
        severity: inferred.severity,
        recommendedActions: [
          "Take rest",
          "Use the recommended medicine as directed",
          "Seek in-person care if symptoms worsen"
        ],
        escalate: false,
        recommendedSpecialist: inferred.specialist,
        prescription: {
          recommended_medications: [
            { name: inferred.med.name, dose: inferred.med.dose, duration: inferred.med.duration, notes: inferred.med.notes }
          ],
          notes_for_clinician: "Fallback generated because LLM was unreachable (network/DNS). Verify clinical details."
        }
      }

      // generate PDF and return same shape as normal success
      try {
        const { url: pdfUrl, filename } = await generateAndSavePdf(fallbackResult, sessionId)
        return NextResponse.json({ ok: true, data: fallbackResult, pdf: { url: pdfUrl, filename }, fallback: true })
      } catch (pdfErr: any) {
        console.error("Failed to generate fallback PDF", pdfErr)
        return NextResponse.json({ ok: true, data: fallbackResult, pdf: null, fallback: true, note: "pdf_failed" })
      }
    }

    const text = resp.data?.choices?.[0]?.message?.content ?? resp.data?.output ?? ""
    let result: any
    try {
      result = JSON.parse(text)
    } catch (e) {
      console.error("LLM did not return JSON:", text)
      return NextResponse.json({ error: "LLM did not return strict JSON", raw: text }, { status: 502 })
    }

    if (!result.replyText || !result.symptoms || !Array.isArray(result.symptoms)) {
      return NextResponse.json({ error: "LLM returned invalid schema", data: result }, { status: 502 })
    }

    const { url: pdfUrl, filename } = await generateAndSavePdf(result, sessionId)
    return NextResponse.json({ ok: true, data: result, pdf: { url: pdfUrl, filename } })
  } catch (err: any) {
    console.error("assistant route error", err?.message || err)
    return NextResponse.json({ ok: false, error: (err?.message || "server error") }, { status: 500 })
  }
}

async function generateAndSavePdf(report: any, sessionId: string) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 780])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const { symptoms = [], severity = 'unknown', recommendedActions = [], prescription = {}, diagnosis = 'unknown' } = report

  const left = 40
  let y = 740
  const lineHeight = 18
  page.drawText(`Doctor.ai - Visit Report`, { x: left, y, size: 16, font })
  y -= lineHeight
  page.drawText(`Date: ${new Date().toISOString()}`, { x: left, y, size: 10, font })
  y -= lineHeight
  page.drawText(`Session: ${sessionId}`, { x: left, y, size: 10, font })
  y -= lineHeight
  page.drawText(`Diagnosis: ${diagnosis}`, { x: left, y, size: 12, font })
  y -= lineHeight
  page.drawText(`Symptoms: ${Array.isArray(symptoms) ? symptoms.join(", ") : String(symptoms)}`, { x: left, y, size: 10, font })
  y -= lineHeight
  page.drawText(`Severity: ${severity}`, { x: left, y, size: 10, font })
  y -= lineHeight
  page.drawText(`Recommended Actions: ${Array.isArray(recommendedActions) ? recommendedActions.join("; ") : String(recommendedActions)}`, { x: left, y, size: 10, font })
  y -= lineHeight
  page.drawText(`Prescription:`, { x: left, y, size: 12, font })
  y -= lineHeight

  const meds = prescription.recommended_medications || []
  for (let i = 0; i < meds.length; i++) {
    const m = meds[i]
    const text = `${i + 1}. ${m.name || '—'} — ${m.dose || '—'} — ${m.duration || '—'} — ${m.notes || ''}`
    page.drawText(text, { x: left + 10, y, size: 10, font })
    y -= lineHeight
    if (y < 60) break
  }

  page.drawText(`Notes for clinician: ${prescription.notes_for_clinician || ''}`, { x: left, y, size: 10, font })

  const pdfBytes = await pdfDoc.save()

  const reportsDir = path.join(process.cwd(), 'public', 'reports')
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })

  const filename = `${sessionId}_${Date.now()}.pdf`
  const filePath = path.join(reportsDir, filename)
  fs.writeFileSync(filePath, Buffer.from(pdfBytes))

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? ''
  const url = `${base}/reports/${filename}`
  return { filePath, url, filename }
}
