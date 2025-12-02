import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from "@/lib/generated/prisma";
import { currentUser } from "@clerk/nextjs/server";

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
  const user = await currentUser();
  const { notes, selectedDoctor } = await request.json();

  try {
    const sessionId = uuidv4()
    const result = await prisma.session.create({
      data: {
        sessionId,
        createdBy: user?.emailAddresses[0]?.emailAddress || 'unknown',
        notes: notes || "",
        createdOn: new Date().toString(),
        selectedDocter: selectedDoctor || null,
      }
    })

    return NextResponse.json(result)
  } catch (e) {
    console.error("Error creating session:", e);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    const user = await currentUser()
    const userEmail = user?.emailAddresses[0]?.emailAddress || 'unknown';

    // If sessionId is provided, return single session (current behavior)
    if (sessionId) {
      const result = await prisma.session.findFirst({
        where: {
          sessionId: sessionId,
          ...(userEmail !== 'unknown' ? { createdBy: userEmail } : {})
        },
      })

      if (!result) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json(result)
    }

    // If no sessionId provided, return all sessions for the current user (history list)
    const sessions = await prisma.session.findMany({
      where: {
        ...(userEmail !== 'unknown' ? { createdBy: userEmail } : {})
      },
      orderBy: {
        createdOn: 'desc'
      }
    })

    // Avoid returning raw binary data for PDFs in the list — return a small flag instead so the client can request the bytes via the download endpoint.
    const safeSessions = sessions.map((s) => ({
      id: s.id,
      sessionId: s.sessionId,
      notes: s.notes,
      selectedDocter: s.selectedDocter,
      conversation: s.conversation,
      report: s.report,
      createdBy: s.createdBy,
      createdOn: s.createdOn,
      hasReportPdf: !!s.reportPdf,
      reportPdfName: s.reportPdfName ?? null
    }))

    return NextResponse.json(safeSessions)

    // NOTE: code path unreachable because the response above returns earlier
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, conversation, report } = await request.json()

    console.log(`[DEBUG] Updating session ${sessionId}, conversation: ${conversation ? conversation.length : 0} messages, report: ${report ? 'present' : 'not present'}`);

    if (!sessionId) {
      console.error(`[DEBUG] Session ID is required`);
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (conversation !== undefined) {
      updateData.conversation = conversation;
    }
    if (report !== undefined) {
      updateData.report = report;
    }

    console.log(`[DEBUG] Update data:`, updateData);

    const updated = await prisma.session.update({
      where: {
        sessionId
      },
      data: updateData
    })

    console.log(`[DEBUG] Session updated successfully`);
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[DEBUG] Error updating session:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
