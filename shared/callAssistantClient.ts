import { fetchJson } from "./fetchJson"

export async function callAssistantAndSaveHistory(payload: { transcript: string; sessionId?: string }) {
  const json = await fetchJson('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const pdfUrl = json.pdf?.url
  if (pdfUrl) window.open(pdfUrl, '_blank')

  await fetchJson('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: payload.sessionId ?? `session_${Date.now()}`,
      notes: json.data?.replyText ?? '',
      conversation: { transcript: payload.transcript },
      report: { ...json.data, pdfUrl },
      timestamp: new Date().toISOString()
    })
  })

  return json.data
}