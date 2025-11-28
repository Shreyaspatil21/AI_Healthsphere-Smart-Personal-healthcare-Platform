import fs from 'fs'
import path from 'path'
import { PrismaClient } from './generated/prisma'

let prisma: PrismaClient | undefined
let prismaAvailable = true

function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    if (!fs.existsSync(envPath)) return
    const raw = fs.readFileSync(envPath, 'utf8')
    const m = raw.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m)
    if (m && m[1]) {
      let v = m[1].trim()
      // strip surrounding quotes if present
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      process.env.DATABASE_URL = v
    }
  } catch (e) {
    // ignore
  }
}

// Ensure env var is set (helpful in some dev setups where dotenv wasn't loaded)
if (!process.env.DATABASE_URL) {
  loadEnvLocal()
}

try {
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient()
  } else {
    // @ts-ignore global attach
    if (!global.prisma) {
      // @ts-ignore
      global.prisma = new PrismaClient()
    }
    // @ts-ignore
    prisma = global.prisma
  }
} catch (err) {
  console.error('Prisma initialization failed in lib/prismaClient:', err)
  prismaAvailable = false
  prisma = undefined
}

export { prisma, prismaAvailable }
