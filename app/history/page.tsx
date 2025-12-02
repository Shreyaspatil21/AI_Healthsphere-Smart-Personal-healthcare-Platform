"use client"
import React, { useEffect, useState } from "react"

export default function HistoryPage() {
  const [items, setItems] = useState<any[] | null>(null)
  const [reports, setReports] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // Load history entries
        const historyRes = await fetch("/api/history")
        const historyJson = await historyRes.json()
        if (!historyRes.ok) {
          setError(JSON.stringify(historyJson))
          setItems([])
        } else {
          setItems(historyJson || [])
        }

        // Load all PDF reports
        const reportsRes = await fetch("/api/reports")
        const reportsJson = await reportsRes.json()
        if (!reportsRes.ok) {
          console.warn("Failed to load reports:", reportsJson)
          setReports([])
        } else {
          setReports(reportsJson || [])
        }
      } catch (e: any) {
        setError(String(e))
        setItems([])
        setReports([])
      }
    }
    load()
  }, [])

  if (items === null) return <div className="p-6">Loading history...</div>
  if (items.length === 0) {
    return (
      <main className="p-6">
        <h1 className="text-2xl mb-4">Visit History</h1>
        <div className="p-4 bg-yellow-50 border rounded">No history yet.</div>
        {error && <pre className="mt-4 p-3 bg-red-50 text-sm text-red-700">{error}</pre>}
      </main>
    )
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl mb-6">Visit History</h1>

      {/* All PDF Reports Section */}
      {reports && reports.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl mb-4">All Generated Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((rep, idx) => {
              const created = rep?.createdAt ? new Date(rep.createdAt) : null
              const createdStr = created && !isNaN(created.getTime()) ? created.toLocaleString() : 'Date not available'
              const filenameRaw = rep?.filename ?? ''
              const displayName = filenameRaw
                ? filenameRaw.replace('.pdf', '').replace(/_/g, ' ')
                : (rep?.url ? (rep.url.split('/').pop() || 'Report') : 'Report')
              const key = filenameRaw || rep?.url || `report-${idx}`

              return (
                <article key={key} className="border rounded p-4 bg-blue-50 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-gray-500">{createdStr}</div>
                      <h3 className="text-lg font-semibold mt-1">{displayName}</h3>
                    </div>
                    <a href={rep?.url} target="_blank" rel="noreferrer" className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Download PDF</a>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {/* History Entries Section */}
      <div className="space-y-4">
        {items.map((it) => {
          const report = it.report ?? {}
          const med = report.medicine ?? report.prescription?.recommended_medications?.[0] ?? null
          const pdfUrl = report.pdfUrl ?? report.pdf?.url ?? it.pdfUrl ?? null
          const createdDate = new Date(it.createdAt)
          const isValidDate = !isNaN(createdDate.getTime())
          return (
            <article key={it.id} className="border rounded p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-gray-500">{isValidDate ? createdDate.toLocaleString() : 'Date not available'}</div>
                  <h2 className="text-lg font-semibold mt-1">{report.disease ?? it.notes ?? "Visit"}</h2>
                  <div className="text-sm text-gray-700 mt-1"><strong>Doctor:</strong> {report.doctorType ?? it.doctor ?? "General Physician"}</div>
                </div>
                {pdfUrl && (
                  <div>
                    <a href={pdfUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-blue-600 text-white rounded">Download PDF</a>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h3 className="font-medium">Prescription</h3>
                {med ? (
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    <li><strong>Medicine:</strong> {med.name}</li>
                    <li><strong>Dose:</strong> {med.dose ?? med.dosage ?? med.dosage}</li>
                    <li><strong>When:</strong> {med.when ?? med.duration ?? med.duration}</li>
                    {med.notes && <li><strong>Notes:</strong> {med.notes}</li>}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-600 mt-2">No prescription available.</div>
                )}
                {report.answers && report.answers.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium">Follow-up answers</h4>
                    <ol className="list-decimal list-inside text-sm mt-1 space-y-1">
                      {report.answers.map((a:any, i:number) => (
                        <li key={i}><strong>{a.question}</strong> — {a.answer}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}