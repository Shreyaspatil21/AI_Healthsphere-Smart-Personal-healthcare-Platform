import { NextRequest, NextResponse } from "next/server";
import { openai, generateFallbackResponse } from "@/shared/OpenAiModel";
import { PrismaClient } from "@/lib/generated/prisma";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    console.log(`[DEBUG] Generating report for session: ${sessionId}`);

    if (!sessionId) {
      console.error(`[DEBUG] Session ID is required`);
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Fetch session with conversation
    const session = await prisma.session.findFirst({
      where: { sessionId }
    });

    if (!session) {
      console.error(`[DEBUG] Session not found: ${sessionId}`);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    console.log(`[DEBUG] Session found, conversation length: ${session.conversation ? (session.conversation as any[]).length : 0}`);

    const conversation = session.conversation as any[] || [];

    if (conversation.length === 0) {
      console.error(`[DEBUG] No conversation data available for session: ${sessionId}`);
      console.error(`[DEBUG] Session conversation field:`, session.conversation);
      return NextResponse.json({
        error: "No conversation data available. Please ensure you had a conversation during the call before generating a report."
      }, { status: 400 });
    }

    // Prepare conversation for analysis
    const conversationText = conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    console.log(`[DEBUG] Conversation text prepared, length: ${conversationText.length}`);
    console.log(`[DEBUG] Full conversation text:`, conversationText);

    const systemPrompt = `You are a medical professional analyzing a patient consultation. Based on the conversation, generate a comprehensive medical report including:
    1. Patient Information (extract name, age if mentioned)
    2. Chief Complaint
    3. Medical History (if mentioned)
    4. Assessment/Diagnosis
    5. Prescription/Recommendations
    6. Follow-up instructions

    IMPORTANT: Analyze the conversation carefully and extract specific information. Do not use generic placeholders like "Not specified" unless truly no information is available. Look for:
    - Patient's name (often mentioned at the beginning)
    - Age or age-related information
    - Specific symptoms or complaints
    - Any medical history mentioned
    - Specific conditions or diagnoses discussed
    - Any treatments or medications mentioned
    - Specific follow-up recommendations

    Format the response as a VALID JSON object with the following structure:
    {
      "patientInfo": {
        "name": "string",
        "age": "string"
      },
      "chiefComplaint": "string",
      "medicalHistory": "string",
      "assessment": "string",
      "prescription": "string",
      "followUp": "string",
      "generatedAt": "ISO date string"
    }

    CRITICAL: Return ONLY the JSON object, no markdown formatting, no code blocks, no explanations. Just pure JSON.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Please analyze this consultation and generate a medical report:\n\n${conversationText}` }
    ];

    try {
      console.log(`[DEBUG] Calling OpenAI API for report generation`);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.3,
        max_tokens: 1000
      });

      const reportContent = response.choices[0]?.message?.content || "{}";
      console.log(`[DEBUG] OpenAI response received, length: ${reportContent.length}`);
      console.log(`[DEBUG] OpenAI response content:`, reportContent);

      // Parse the JSON response - handle markdown code blocks
      let report;
      try {
        // Remove markdown code block formatting if present
        let cleanContent = reportContent.trim();
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        report = JSON.parse(cleanContent);
        console.log(`[DEBUG] Report JSON parsed successfully`);
      } catch (parseError) {
        console.error("[DEBUG] Error parsing report JSON:", parseError);
        console.error("[DEBUG] Raw content that failed to parse:", reportContent);
        // Fallback to basic structure
        report = {
          patientInfo: { name: "Not specified", age: "Not specified" },
          chiefComplaint: "Unable to determine from conversation",
          medicalHistory: "Not specified",
          assessment: "Further evaluation needed",
          prescription: "Consult with healthcare provider",
          followUp: "Schedule follow-up appointment",
          generatedAt: new Date().toISOString()
        };
      }

      // Update session with report
      console.log(`[DEBUG] Updating session with report`);

      // Generate a professional PDF representation of the report using pdf-lib
      let pdfBytes: Uint8Array | null = null;
      let pdfName: string | null = null;
      try {
        const pdfDoc = await PDFDocument.create()
        let page = pdfDoc.addPage([595, 842]) // A4 size
        const { width, height } = page.getSize()

        const helv = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const helvetBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        
        let y = height - 40

        // Helper to write text with wrapping
        const drawText = (text: string, x: number, fontSize: number, isBold = false, maxWidth = width - 80) => {
          const font = isBold ? helvetBold : helv
          const words = text.split(/\s+/)
          let line = ''
          const lines: string[] = []
          
          for (const word of words) {
            const testLine = line ? `${line} ${word}` : word
            const testWidth = font.widthOfTextAtSize(testLine, fontSize)
            if (testWidth > maxWidth && line) {
              lines.push(line)
              line = word
            } else {
              line = testLine
            }
          }
          if (line) lines.push(line)
          
          for (const l of lines) {
            page.drawText(l, { x, y, size: fontSize, font, color: rgb(0, 0, 0) })
            y -= fontSize + 4
            
            // Add new page if needed
            if (y < 50) {
              page = pdfDoc.addPage([595, 842])
              y = height - 40
            }
          }
          return y
        }

        const drawSection = (title: string, content: string) => {
          y -= 8
          y = drawText(title, 40, 12, true)
          y -= 4
          y = drawText(content || 'Not specified', 50, 10)
          y -= 8
        }

        // Header
        page.drawLine({ start: { x: 40, y: height - 30 }, end: { x: width - 40, y: height - 30 }, thickness: 2, color: rgb(0, 0, 0.8) })
        y = drawText('MEDICAL CONSULTATION REPORT', 40, 16, true)
        y -= 4
        
        // Report info
        const generatedDate = new Date(report.generatedAt || new Date().toISOString()).toLocaleString()
        y = drawText(`Generated on: ${generatedDate}`, 40, 9)
        y -= 12

        // Patient Information
        drawSection('PATIENT INFORMATION', '')
        y = drawText(`Name: ${report.patientInfo?.name || 'Not specified'}`, 50, 10)
        y = drawText(`Age: ${report.patientInfo?.age || 'Not specified'}`, 50, 10)
        
        // Chief Complaint
        drawSection('CHIEF COMPLAINT', report.chiefComplaint)
        
        // Medical History
        drawSection('MEDICAL HISTORY', report.medicalHistory)
        
        // Assessment
        drawSection('ASSESSMENT / DIAGNOSIS', report.assessment)
        
        // Prescription
        drawSection('PRESCRIPTION / RECOMMENDATIONS', report.prescription)
        
        // Follow-up
        drawSection('FOLLOW-UP INSTRUCTIONS', report.followUp)
        
        // Footer
        y -= 20
        page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.7, 0.7, 0.7) })
        y -= 10
        drawText('This report was generated by an AI Medical Assistant. Please consult with a qualified healthcare professional for final diagnosis and treatment.', 40, 8)

        const pdfBuffer = await pdfDoc.save()
        pdfBytes = new Uint8Array(pdfBuffer)
        pdfName = `medical-report-${report.patientInfo?.name?.replace(/\s+/g, '-') || sessionId}.pdf`
      } catch (pdfError) {
        console.error('[DEBUG] Failed to generate PDF for report:', pdfError)
      }

      const updateData: any = { report }
      if (pdfBytes) {
        updateData.reportPdf = pdfBytes
        updateData.reportPdfName = pdfName
      }

      await prisma.session.update({
        where: { sessionId },
        data: updateData
      });
      console.log(`[DEBUG] Session updated successfully with report`);

      return NextResponse.json({ report });

    } catch (openaiError) {
      console.error("[DEBUG] Error calling OpenAI API for report generation:", openaiError);

      const fallbackReport = {
        patientInfo: { name: "Not specified", age: "Not specified" },
        chiefComplaint: "Unable to process conversation",
        medicalHistory: "Not specified",
        assessment: "Technical error occurred during analysis",
        prescription: "Please consult a healthcare professional",
        followUp: "Contact medical support",
        generatedAt: new Date().toISOString()
      };

      // Still update session with fallback report
      console.log(`[DEBUG] Using fallback report due to OpenAI error`);
      await prisma.session.update({
        where: { sessionId },
        data: { report: fallbackReport }
      });

      return NextResponse.json({ report: fallbackReport });
    }

  } catch (error) {
    console.error("Error in generate-report API:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}