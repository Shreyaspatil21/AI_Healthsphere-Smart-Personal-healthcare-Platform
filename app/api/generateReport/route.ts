export const runtime = 'nodejs'
import { NextResponse } from "next/server"
import { PDFDocument, StandardFonts } from "pdf-lib"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { report, sessionId = `session_${Date.now()}` } = body
    if (!report) return NextResponse.json({ error: "missing report" }, { status: 400 })

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 780])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Embed logo if exists
    let logoImage
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png')
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath)
        logoImage = await pdfDoc.embedPng(logoBytes)
      }
    } catch (e) {
      console.warn("Logo not found or failed to embed")
    }

    const left = 40
    let y = 740
    const lh = 18

    // Header Section
    if (logoImage) {
      page.drawImage(logoImage, { x: left, y: y - 20, width: 100, height: 50 })
      y -= 70
    }

    page.drawText(`Doctor.ai - Medical Prescription`, { x: left, y, size: 18, font: boldFont }); y -= lh + 5
    page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, { x: left, y, size: 12, font }); y -= lh + 10

    // Patient Information Section
    page.drawText(`Patient Information`, { x: left, y, size: 14, font: boldFont }); y -= lh
    page.drawLine({ start: { x: left, y: y }, end: { x: 560, y: y }, thickness: 1 }); y -= lh
    page.drawText(`Name: ${report.patientName || 'N/A'}`, { x: left + 10, y, size: 12, font }); y -= lh
    page.drawText(`Age: ${report.age || 'N/A'}`, { x: left + 10, y, size: 12, font }); y -= lh + 10

    // Diagnosis Section
    page.drawText(`Diagnosis`, { x: left, y, size: 14, font: boldFont }); y -= lh
    page.drawLine({ start: { x: left, y: y }, end: { x: 560, y: y }, thickness: 1 }); y -= lh
    page.drawText(`Chief Complaint: ${report.disease || 'N/A'}`, { x: left + 10, y, size: 12, font }); y -= lh
    page.drawText(`Doctor: ${report.doctorType || 'N/A'}`, { x: left + 10, y, size: 12, font }); y -= lh + 10

    // Medicine Section (Table-like)
    page.drawText(`Prescribed Medicine`, { x: left, y, size: 14, font: boldFont }); y -= lh
    page.drawLine({ start: { x: left, y: y }, end: { x: 560, y: y }, thickness: 1 }); y -= lh
    page.drawText(`Medicine Name: ${report.medicine?.name || 'N/A'}`, { x: left + 10, y, size: 12, font }); y -= lh
    page.drawText(`Dosage: ${report.medicine?.dosage || 'N/A'}`, { x: left + 10, y, size: 12, font }); y -= lh
    page.drawText(`Instructions: ${report.medicine?.when || 'N/A'}`, { x: left + 10, y, size: 12, font }); y -= lh + 10

    // Follow-up Answers Section
    if (report.answers && report.answers.length > 0) {
      page.drawText(`Follow-up Questions & Answers`, { x: left, y, size: 14, font: boldFont }); y -= lh
      page.drawLine({ start: { x: left, y: y }, end: { x: 560, y: y }, thickness: 1 }); y -= lh
      for (let i = 0; i < report.answers.length; i++) {
        const a = report.answers[i]
        page.drawText(`${i+1}. ${a.question}: ${a.answer}`, { x: left + 10, y, size: 10, font })
        y -= lh
        if (y < 60) break
      }
    }

    // Conversation Summary Section
    if (report.conversationSummary) {
      page.drawText(`Conversation Summary`, { x: left, y, size: 14, font: boldFont }); y -= lh
      page.drawLine({ start: { x: left, y: y }, end: { x: 560, y: y }, thickness: 1 }); y -= lh
      const summaryLines = report.conversationSummary.split('\n')
      for (const line of summaryLines) {
        page.drawText(line, { x: left + 10, y, size: 10, font })
        y -= lh
        if (y < 60) break
      }
    }

    const pdfBytes = await pdfDoc.save()
    const reportsDir = path.join(process.cwd(), 'public', 'reports')
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })

    // Sanitize patientName and disease for filename
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')
    const patientName = sanitize(report.patientName || 'Patient')
    const disease = sanitize(report.disease || 'Unknown_Disease')
    const timestamp = Date.now()
    const filename = `${patientName}_${disease}_${timestamp}.pdf`
    const filePath = path.join(reportsDir, filename)
    fs.writeFileSync(filePath, Buffer.from(pdfBytes))

    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? ''
    const url = `${base}/reports/${filename}`
    return NextResponse.json({ ok: true, url, filename })
  } catch (err: any) {
    console.error("generateReport error", err)
    return NextResponse.json({ ok: false, error: err?.message || 'error' }, { status: 500 })
  }
}

