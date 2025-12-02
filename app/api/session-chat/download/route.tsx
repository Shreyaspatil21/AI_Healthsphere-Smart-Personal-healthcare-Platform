import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'
import { currentUser } from '@clerk/nextjs/server'

declare global {
  var prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) global.prisma = new PrismaClient()
  prisma = global.prisma
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })

    const user = await currentUser()
    const userEmail = user?.emailAddresses[0]?.emailAddress || 'unknown'

    const session = await prisma.session.findFirst({
      where: {
        sessionId,
        ...(userEmail !== 'unknown' ? { createdBy: userEmail } : {})
      }
    })

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    if (!session.reportPdf) return NextResponse.json({ error: 'No PDF available for this session' }, { status: 404 })

    const filename = session.reportPdfName || `medical-report-${sessionId}.pdf`

    // session.reportPdf is stored as Bytes/Buffer
    const buffer = Buffer.from(session.reportPdf as any)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (err) {
    console.error('Error fetching report PDF:', err)
    return NextResponse.json({ error: 'Failed to fetch report PDF' }, { status: 500 })
  }
}
