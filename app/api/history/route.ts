export const runtime = 'nodejs'
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

type Entry = {
  id: string
  sessionId?: string
  notes?: string
  conversation?: any
  report?: any
  createdAt: string
}

const DATA_DIR = path.join(process.cwd(), "data")
const FILE = path.join(DATA_DIR, "history.json")

function readList(): Entry[] {
  try {
    if (!fs.existsSync(FILE)) return []
    const txt = fs.readFileSync(FILE, "utf8") || "[]"
    return JSON.parse(txt)
  } catch (e) {
    console.error("read history failed", e)
    return []
  }
}

function writeList(list: Entry[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf8")
}

export async function GET() {
  try {
    const list = readList()
    return NextResponse.json(list, { status: 200 })
  } catch (err: any) {
    console.error("history GET error", err)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const list = readList()
    const entry: Entry = {
      id: `${Date.now()}`,
      sessionId: body.sessionId ?? `session_${Date.now()}`,
      notes: body.notes ?? "",
      conversation: body.conversation ?? {},
      report: body.report ?? null,
      createdAt: body.timestamp ?? new Date().toISOString()
    }
    list.unshift(entry)
    writeList(list)
    return NextResponse.json({ ok: true, entry }, { status: 201 })
  } catch (err: any) {
    console.error("history POST error", err)
    return NextResponse.json({ ok: false, error: err?.message || "error" }, { status: 500 })
  }
}