
export const runtime = 'nodejs'
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const reportsDir = path.join(process.cwd(), 'public', 'reports')
    if (!fs.existsSync(reportsDir)) return NextResponse.json([], { status: 200 })
    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.pdf'))
    const reports = files.map(f => {
      const filePath = path.join(reportsDir, f)
      const stats = fs.statSync(filePath)
      return {
        filename: f,
        url: `/reports/${f}`,
        createdAt: stats.mtime.toISOString()
      }
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by newest first
    return NextResponse.json(reports, { status: 200 })
  } catch (err: any) {
    console.error("reports GET error", err)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}

