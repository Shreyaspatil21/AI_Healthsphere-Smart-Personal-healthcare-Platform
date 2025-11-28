export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'

function sanitizeFilename(name: string) {
  return name.replace(/[:\\/\\?<>\\*|"'\\]/g, '-').replace(/\s+/g, '_')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { filename, data } = body // data expected as data:<mime>;base64, filename optional
    if (!data) return NextResponse.json({ error: 'No data provided' }, { status: 400 })

    const reportsDir = path.join(process.cwd(), 'public', 'reports')
    try {
      await fsp.mkdir(reportsDir, { recursive: true })
    } catch (mkdirErr: any) {
      console.error('Could not create reports directory', mkdirErr)
      return NextResponse.json({ error: 'Could not create reports directory', details: mkdirErr?.message }, { status: 500 })
    }

    // determine filename
    const timestamp = new Date().toISOString().replace(/[:]/g, '-')
    const baseName = filename ? sanitizeFilename(filename) : `report_${timestamp}.pdf`
    const finalName = baseName.toLowerCase().endsWith('.pdf') ? baseName : `${baseName}.pdf`
    const filePath = path.join(reportsDir, finalName)

    // data might be like 'data:application/pdf;base64,JVBERi0x...'
    const dataUriMatch = typeof data === 'string' ? data.match(/^data:(.+);base64,(.+)$/) : null
    let buffer: Buffer
    try {
      if (dataUriMatch) {
        buffer = Buffer.from(dataUriMatch[2], 'base64')
      } else if (typeof data === 'string') {
        // assume raw base64
        buffer = Buffer.from(data, 'base64')
      } else {
        return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
      }
    } catch (bufErr: any) {
      console.error('Failed to parse incoming base64 data', bufErr)
      return NextResponse.json({ error: 'Failed to parse base64 data', details: bufErr?.message }, { status: 400 })
    }

    try {
      await fsp.writeFile(filePath, buffer)
    } catch (writeErr: any) {
      console.error('Failed to write report file', writeErr)
      // Common Windows OneDrive EPERM issues can appear here; return details to help debugging
      return NextResponse.json({ error: 'Failed to write file', details: writeErr?.message }, { status: 500 })
    }

    try {
      const stat = await fsp.stat(filePath)
      return NextResponse.json({ filename: finalName, url: `/reports/${finalName}`, createdAt: stat.mtime.toISOString() }, { status: 200 })
    } catch (statErr: any) {
      console.error('Saved file but failed to stat it', statErr)
      return NextResponse.json({ filename: finalName, url: `/reports/${finalName}` }, { status: 200 })
    }
  } catch (err: any) {
    console.error('reports save error', err)
    // expose message in dev to help debugging; in production consider hiding details
    return NextResponse.json({ error: 'failed', details: err?.message }, { status: 500 })
  }
}
