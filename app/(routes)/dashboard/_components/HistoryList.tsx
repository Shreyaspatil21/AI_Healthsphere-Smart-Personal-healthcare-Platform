"use client"
import Image from 'next/image'
<<<<<<< HEAD
import React, { useEffect, useState } from 'react'
import AddNewSession from './AddNewSession'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import jsPDF from 'jspdf'

function HistoryList() {
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await axios.get('/api/session-chat')
      console.log('[HistoryList] Fetched history:', res.data)
      setHistory(res.data || [])
    } catch (err: any) {
      console.error('[HistoryList] Failed to fetch history:', err)
      setError('Failed to load session history: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  const downloadReportPdf = async (s: any) => {
    // If server stored PDF is available, use the server endpoint to download it.
    if (s.hasReportPdf) {
      try {
        const downloadUrl = `/api/session-chat/download?sessionId=${encodeURIComponent(s.sessionId)}`
        const res = await fetch(downloadUrl)
        if (!res.ok) throw new Error('Server returned an error when attempting to download')

        const blob = await res.blob()
        const disp = res.headers.get('Content-Disposition') || ''
        let filename = `medical-report-${s.sessionId}.pdf`
        const match = disp.match(/filename="?(.*?)"?(;|$)/i)
        if (match && match[1]) filename = match[1]

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        return
      } catch (err) {
        console.warn('Server download failed; falling back to client-side generation', err)
      }
    }

    // Fallback to client-side generation when server doesn't have a stored PDF
    try {
      const report = s.report
      const pdf = new jsPDF('p', 'mm', 'a4')
      const title = 'Medical Consultation Report'
      const pageWidth = pdf.internal.pageSize.getWidth()
      pdf.setFontSize(14)
      pdf.text(title, pageWidth / 2, 15, { align: 'center' })

      pdf.setFontSize(10)
      let y = 30
      const addText = (txt: string) => {
        const split = pdf.splitTextToSize(txt, pageWidth - 20)
        pdf.text(split, 10, y)
        y += split.length * 6
        if (y > 280) {
          pdf.addPage()
          y = 20
        }
      }

      addText(`Generated on: ${formatDate(report.generatedAt || new Date().toISOString())}`)
      addText('\n')

      if (report.patientInfo) {
        addText('PATIENT INFORMATION')
        addText(`Name: ${report.patientInfo.name || 'N/A'}`)
        addText(`Age: ${report.patientInfo.age || 'N/A'}`)
        addText('\n')
      }

      const sections = [
        ['CHIEF COMPLAINT', report.chiefComplaint],
        ['MEDICAL HISTORY', report.medicalHistory],
        ['ASSESSMENT/DIAGNOSIS', report.assessment],
        ['PRESCRIPTION/RECOMMENDATIONS', report.prescription],
        ['FOLLOW-UP INSTRUCTIONS', report.followUp],
      ]

      for (const [heading, content] of sections) {
        addText(heading)
        addText((content || '').toString())
        addText('\n')
      }

      const fileName = `medical-report-${s.sessionId}.pdf`
      pdf.save(fileName)
    } catch (err) {
      console.error('Failed to create PDF for report (client-side):', err)
      alert('Failed to generate PDF. Please view the report and try download from the report page.')
    }
  }

  return (
    <div className='mt-10'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold'>Session History</h3>
        <div className='flex gap-2'>
          <Button size='sm' variant='outline' onClick={loadHistory} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <AddNewSession />
        </div>
      </div>

      {isLoading && <div className='text-center py-8'>Loading session history...</div>}
      {error && <div className='text-center py-4 bg-red-50 border border-red-200 rounded-md text-red-700'>{error}</div>}

      {!isLoading && !error && history.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-5 mt-5 p-7 border-2 border-dashed border-gray-200 rounded-2xl">
          <Image
            src="/medical-assistance.png"
            alt="No consultations"
            width={150}
            height={150}
          />
          <h2 className="font-bold">No Consultations Yet</h2>
          <p className="text-gray-500">You don&apos;t have any consultations with any doctor yet.</p>
          <p className="text-xs text-gray-400">Start a new session to create your first medical report.</p>
        </div>
      )}

      {!isLoading && !error && history.length > 0 && (
        <div className='mb-4 text-sm text-muted-foreground'>
          Showing {history.length} consultation{history.length !== 1 ? 's' : ''}
        </div>
      )}

      <div className='grid grid-cols-1 gap-4'>
        {history.map((s) => (
          <div key={s.sessionId} className='p-4 border rounded-md bg-card flex items-center justify-between'>
            <div>
              <div className='flex items-center gap-2'>
                <FileText className='w-4 h-4' />
                <div className='font-semibold'>{s.selectedDocter?.specialist || 'Consultation'}</div>
              </div>
              <div className='text-sm text-muted-foreground'>{formatDate(s.createdOn)}</div>
              <div className='text-sm text-muted-foreground mt-1'>Patient: {s.report?.patientInfo?.name ?? 'Unknown'}</div>
              <div className='text-sm text-muted-foreground mt-1'>Disease: {s.selectedDocter?.disease || s.notes || 'Unknown'}</div>
              {s.report && (
                <div className='text-xs mt-2 text-foreground/90'>{s.report.chiefComplaint?.substring(0, 120) ?? ''}</div>
              )}
            </div>

            <div className='flex items-center gap-2'>
              {s.report ? (
                <>
                  <Button size='sm' variant='outline' onClick={() => downloadReportPdf(s)}>
                    <Download className='w-3 h-3 mr-2' /> Download PDF
                  </Button>
                </>
              ) : (
                <div className='text-xs text-muted-foreground'>No report</div>
              )}
            </div>
          </div>
        ))}
      </div>
=======
import React, { useState } from 'react'
import AddNewSession from './AddNewSession'

function HistoryList() {
  const [history] = useState([])

  return (
    <div className='mt-10'>
      {
        history.length == 0 ? (
          
          <div className="flex flex-col items-center justify-center gap-5 mt-5 p-7 border-2 border-dashed border-gray-200 rounded-2xl">
            <Image
              src="/medical-assistance.png"
              alt="No consultations"
              width={150}
              height={150}
            />
            <h2 className="font-bold">No Consultations Yet</h2>
            <p className="text-gray-500">You don&apos;t have any consultations with any doctor yet.</p>
            <AddNewSession />
          </div>
        ) : (
          <div></div>
        )
      }
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
    </div>
  )
}

export default HistoryList
