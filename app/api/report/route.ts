
import { NextResponse } from 'next/server';
import { prisma, prismaAvailable } from '@/lib/prismaClient'
import axios from 'axios';

if (!prismaAvailable || !prisma) {
  console.warn('Database not configured; /api/report will return 503 for DB calls')
}

// This function handles POST requests to generate a report
export async function POST(request: Request) {
  if (!prismaAvailable || !prisma) {
    return NextResponse.json({ error: 'Database not configured', details: 'PrismaClient failed to initialize' }, { status: 503 })
  }
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // 1. Fetch the conversation from our database
    const session = await prisma.session.findUnique({
      where: { sessionId: sessionId },
    });

    if (!session || !session.conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const conversationText = JSON.stringify(session.conversation);
    const doctorName = (session.selectedDocter as any)?.name || 'General Physician';

    // 2. Create a detailed prompt for the AI to generate a systematic report
    const prompt = `
      You are a medical professional writing a formal consultation report.
      Based on the conversation transcript below, generate a systematic medical report.
      The report MUST include these sections, formatted with markdown:
      - **Patient Details:** (Infer name and age if mentioned, otherwise state "Not provided")
      - **Date of Consultation:** ${new Date(session.createdOn).toLocaleDateString()}
      - **Consulting Doctor:** Dr. ${doctorName}
      - **Chief Complaint:** (Summarize the main reason for the consultation)
      - **Provisional Diagnosis:** (Identify the most likely disease or condition)
      - **Recommendations & Plan:** (List the suggested next steps, tests, or treatments)

      Conversation Transcript:
      ${conversationText}
    `;

    // 3. Send the prompt to the OpenRouter AI
    const openRouterResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: { 'Authorization': `Bearer ${process.env.OPEN_ROUTER_API_KEY}` },
      }
    );

    const reportContent = openRouterResponse.data.choices[0].message.content;

    // 4. Save the generated report back to the database
    const updatedSession = await prisma.session.update({
      where: { sessionId: sessionId },
      data: { report: reportContent },
    });

    return NextResponse.json(updatedSession, { status: 200 });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
