"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import { useParams } from 'next/navigation'
import { Circle, PhoneCall, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

import ConversationDisplay from '../components/ConversationDisplay'
import LanguageSelector from '../components/LanguageSelector'

// --- Types ---
type Medicine = {
  name: string
  dosage: string
  instructions?: string
  duration?: string
}

type Report = {
  patientName?: string
  age?: string | number
  disease?: string
  doctorType?: string
  medicine?: Medicine
  precautions?: string
  pdfUrl?: string
  url?: string
  createdAt?: string
  filename?: string
}

const INDIAN_LANGUAGES: { label: string; code: string }[] = [
  { label: 'English (India)', code: 'en-IN' },
  { label: 'Hindi', code: 'hi-IN' },
  { label: 'Bengali', code: 'bn-IN' },
  { label: 'Tamil', code: 'ta-IN' },
  { label: 'Telugu', code: 'te-IN' },
  { label: 'Marathi', code: 'mr-IN' },
  { label: 'Kannada', code: 'kn-IN' },
  { label: 'Malayalam', code: 'ml-IN' },
  { label: 'Gujarati', code: 'gu-IN' },
  { label: 'Punjabi', code: 'pa-IN' }
]

export default function MedicalVoiceAgent({ sessionId: sessionIdProp }: { sessionId?: string }) {
  const params = useParams()
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : (params.sessionId as string | undefined) || sessionIdProp

  // UI and speech state
  const [isCallActive, setIsCallActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; timestamp: number }[]>([])
  const [userCaption, setUserCaption] = useState('')
  const [assistantCaption, setAssistantCaption] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-IN')

  const [latestReport, setLatestReport] = useState<Report | null>(null)

  // conversation stages per your spec
  const [stage, setStage] = useState<'idle' | 'ask_disease' | 'suggest_doctor' | 'ask_language' | 'collect_details' | 'followups' | 'confirm' | 'ended'>('idle')
  const [userData, setUserData] = useState<{ name?: string; age?: string | number; disease?: string; answers: string[] }>({ answers: [] })
  const followUpIndexRef = useRef(0)

  // Speech refs
  const recognitionRef = useRef<any | null>(null)
  const suppressRecognitionDuringTTS = useRef(false)

  // ----- Helpers: messages, TTS and recognition -----
  const pushMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content, timestamp: Date.now() }])
  }, [])

  const speakText = useCallback((text: string) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return
    suppressRecognitionDuringTTS.current = true
    try { recognitionRef.current?.stop?.() } catch {}
    const u = new SpeechSynthesisUtterance(text)
    u.lang = selectedLanguage || 'en-IN'
    u.onstart = () => setIsSpeaking(true)
    u.onend = () => {
      setIsSpeaking(false)
      suppressRecognitionDuringTTS.current = false
      // restart recognition after a short pause if call active
      setTimeout(() => { if (isCallActive) startRecognition().catch(() => {}) }, 250)
    }
    window.speechSynthesis.speak(u)
  }, [selectedLanguage, isCallActive])

  const startRecognition = useCallback(async () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) return
    try { await navigator.mediaDevices.getUserMedia({ audio: true }) } catch { return }
    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = selectedLanguage || 'en-IN'
    rec.onstart = () => setIsListening(true)
    rec.onresult = (ev: any) => {
      let interim = ''
      let final = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i]
        if (r.isFinal) final += r[0].transcript
        else interim += r[0].transcript
      }
      if (interim) setUserCaption(interim)
      if (final) {
        setUserCaption(final)
        pushMessage('user', final)
        handleUserInput(final)
      }
    }
    rec.onend = () => { setIsListening(false); if (!suppressRecognitionDuringTTS.current && isCallActive) { try { rec.start() } catch {} } }
    rec.onerror = () => { /* silent */ }
    recognitionRef.current = rec
    try { rec.start() } catch {}
  }, [selectedLanguage, isCallActive, pushMessage])

  const stopRecognition = useCallback(() => {
    const r = recognitionRef.current
    if (r) {
      try { r.stop() } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  // ----- Domain helpers: doctor suggestion, follow-ups, medicine -----
  const suggestDoctorType = useCallback((d?: string) => {
    if (!d) return 'General Physician'
    const s = d.toLowerCase()
    if (s.includes('skin') || s.includes('rash') || s.includes('acne')) return 'Dermatologist'
    if (s.includes('eye') || s.includes('vision')) return 'Ophthalmologist'
    if (s.includes('preg') || s.includes('obst') || s.includes('pregnancy')) return 'Gynecologist'
    if (s.includes('child') || s.includes('pediatric') || s.includes('kid')) return 'Pediatrician'
    if (s.includes('heart') || s.includes('cardiac') || s.includes('chest pain')) return 'Cardiologist'
    if (s.includes('fever') || s.includes('cold') || s.includes('cough') || s.includes('flu')) return 'General Physician'
    if (s.includes('tooth') || s.includes('dental')) return 'Dentist'
    if (s.includes('mental') || s.includes('depress') || s.includes('anxiety')) return 'Psychiatrist'
    return 'General Physician'
  }, [])

  const followUpQuestionsForDisease = useCallback((d?: string) => {
    // return ~6 targeted follow-ups; these are conservative and intended to gather key info
    const s = (d || '').toLowerCase()
    const base = [
      'When did these symptoms start?',
      'How severe are they on a scale from 1 (mild) to 10 (very severe)?',
      'Do you have any known allergies to medicines or foods?',
      'Are you taking any other medications or supplements currently?',
      'Do you have any chronic conditions (e.g., diabetes, hypertension)?',
      'Have you noticed anything that makes the symptoms better or worse?'
    ]
    if (s.includes('fever') || s.includes('temperature')) {
      return [
        'When did the fever start?',
        'Have you measured your temperature? If yes, what is the highest temperature?',
        'Any cough, sore throat, or breathing difficulty?',
        'Are you experiencing body aches or headache?',
        'Any recent travel or exposure to someone unwell?',
        'Any medicines already taken for these symptoms?'
      ]
    }
    if (s.includes('cough')) {
      return [
        'Is the cough dry or productive (with phlegm)?',
        'How long have you had the cough?',
        'Any fever, breathlessness, or chest pain?',
        'Any history of asthma or smoking?',
        'Have you tried any cough medicines already?'
      ]
    }
    return base
  }, [])

  const pickBestMedicine = useCallback((d?: string): Medicine => {
    const s = (d || '').toLowerCase()
    // conservative, single-medicine suggestions; NOT a medical diagnosis
    if (s.includes('fever') || s.includes('temperature') || s.includes('flu')) {
      return { name: 'Paracetamol', dosage: '500 mg', instructions: 'Take 1 tablet every 4–6 hours as needed', duration: '3 days' }
    }
    if (s.includes('cough') && s.includes('dry')) {
      return { name: 'Dextromethorphan', dosage: '10 mg', instructions: 'Take 1 teaspoon (10 ml) every 6–8 hours as needed', duration: '5 days' }
    }
    if (s.includes('cough')) {
      return { name: 'Guaifenesin', dosage: '100 mg/5 ml', instructions: 'Take 5–10 ml every 4–6 hours as needed', duration: '5 days' }
    }
    if (s.includes('pain') || s.includes('headache') || s.includes('migraine')) {
      return { name: 'Ibuprofen', dosage: '400 mg', instructions: 'Take 1 tablet every 6–8 hours as needed with food', duration: '3 days' }
    }
    if (s.includes('cold') || s.includes('congestion')) {
      return { name: 'Cetirizine', dosage: '10 mg', instructions: 'Take 1 tablet at night', duration: '5 days' }
    }
    // default
    return { name: 'Paracetamol', dosage: '500 mg', instructions: 'Take 1 tablet every 4–6 hours as needed', duration: '3 days' }
  }, [])

  // ----- PDF generation / saving -----
  const generateMedicalReport = useCallback(async (reportData: Report) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')

      // Header + logo block
      pdf.setFillColor(33, 150, 243)
      pdf.rect(10, 10, 34, 20, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(10)
      pdf.text('BASE', 13, 25)
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Medical Prescription', 54, 22)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Date: ${new Date().toLocaleString()}`, 54, 30)

      // Patient details box
      pdf.setDrawColor(200)
      pdf.rect(10, 36, 190, 30)
      pdf.setFontSize(12)
      pdf.text('Patient Details', 14, 46)
      pdf.setFontSize(11)
      pdf.text(`Name: ${reportData.patientName || 'N/A'}`, 14, 54)
      pdf.text(`Age: ${reportData.age ?? 'N/A'}`, 110, 54)
      pdf.text(`Disease: ${reportData.disease || 'N/A'}`, 14, 62)
      pdf.text(`Doctor Type: ${reportData.doctorType || 'General Physician'}`, 110, 62)

      let y = 76
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(13)
      pdf.text('Medicine', 14, y)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      y += 8
      if (reportData.medicine) {
        pdf.text(`Name: ${reportData.medicine.name}`, 14, y)
        pdf.text(`Dosage: ${reportData.medicine.dosage}`, 110, y)
        y += 8
        pdf.text(`When / How: ${reportData.medicine.instructions || '—'}`, 14, y)
        y += 8
        pdf.text(`Duration: ${reportData.medicine.duration || '—'}`, 14, y)
        y += 12
      } else {
        pdf.text('No medicine recommended.', 14, y)
        y += 8
      }

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(13)
      pdf.text('Precautions', 14, y)
      y += 8
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      pdf.text(pdf.splitTextToSize(reportData.precautions || 'Rest and hydrate; seek in-person care if symptoms worsen.', 180), 14, y)

      // Footer
      pdf.setFontSize(10)
      pdf.text('Doctor: AI Medical Agent', 14, 270)
      pdf.text('Signature: ___________________', 120, 270)
      pdf.setFontSize(9)
      pdf.text('Generated by AI Medical Agent', 14, 288)

      const dataUri = pdf.output('datauristring') as string
      const safeDisease = (reportData.disease || 'Report').toString().replace(/[\\/:?<>*|"'\s]+/g, '_')
      const ts = new Date().toISOString().replace(/[:]/g, '-')
      const filenameBase = `${safeDisease}_${ts}.pdf`

      const resp = await axios.post('/api/reports/save', { filename: filenameBase, data: dataUri })
      // store a small local history too so UI can show immediate metadata if server listing isn't wired
      const savedMeta = resp?.data ? resp.data : { filename: filenameBase, url: null }
      try {
        const hist = JSON.parse(localStorage.getItem('ai_medical_reports') || '[]') as any[]
        hist.unshift({ filename: savedMeta.filename || filenameBase, url: savedMeta.url || null, createdAt: new Date().toISOString(), patientName: reportData.patientName, disease: reportData.disease })
        localStorage.setItem('ai_medical_reports', JSON.stringify(hist.slice(0, 50)))
      } catch {}

      return savedMeta
    } catch (err) {
      console.error('PDF generation error', err)
      return null
    }
  }, [])

  // ----- Core flow handler -----
  const startCall = useCallback(() => {
    setIsCallActive(true)
    setMessages([])
    setUserCaption('')
    const prompt = 'Please tell me the disease or main symptom you are experiencing.'
    setAssistantCaption(prompt)
    pushMessage('assistant', prompt)
    speakText(prompt)
    setStage('ask_disease')
    startRecognition().catch(() => {})
  }, [pushMessage, speakText, startRecognition])

  const stopCall = useCallback(() => {
    setIsCallActive(false)
    stopRecognition()
    setIsListening(false)
    setIsSpeaking(false)
    setAssistantCaption('')
    setUserCaption('')
    setStage('idle')
  }, [stopRecognition])

  const handleUserInput = useCallback(async (input: string) => {
    setIsThinking(true)
    try {
      const text = input.trim()
      if (!text) return

      // ASK DISEASE
      if (stage === 'ask_disease') {
        setUserData(prev => ({ ...prev, disease: text }))
        const doctorType = suggestDoctorType(text)
        const reply = `For ${text}, a ${doctorType} is commonly suitable. Which language would you prefer? You can say Hindi, English, Telugu, Tamil, Bengali, Marathi, Kannada, Malayalam, Gujarati or Punjabi.`
        pushMessage('assistant', reply)
        setAssistantCaption(reply)
        speakText(reply)
        setStage('ask_language')
        return
      }

      // ASK LANGUAGE
      if (stage === 'ask_language') {
        const matched = INDIAN_LANGUAGES.find(l => text.toLowerCase().includes(l.label.split(' ')[0].toLowerCase()) || text.toLowerCase().includes(l.code.toLowerCase()))
        const chosen = matched ? matched.code : 'en-IN'
        setSelectedLanguage(chosen)
        const reply = `Okay — I'll continue in ${matched ? matched.label : 'English'}. Please tell me your full name.`
        pushMessage('assistant', reply)
        setAssistantCaption(reply)
        speakText(reply)
        setStage('collect_details')
        return
      }

      // COLLECT NAME / AGE
      if (stage === 'collect_details') {
        if (!userData.name) {
          setUserData(prev => ({ ...prev, name: text }))
          const r = 'Thanks. What is your age (in years)?'
          pushMessage('assistant', r)
          setAssistantCaption(r)
          speakText(r)
          return
        }
        if (!userData.age) {
          setUserData(prev => ({ ...prev, age: text }))
          followUpIndexRef.current = 0
          const qList = followUpQuestionsForDisease(userData.disease)
          const first = qList[0]
          pushMessage('assistant', first)
          setAssistantCaption(first)
          speakText(first)
          setStage('followups')
          return
        }
      }

      // FOLLOWUPS
      if (stage === 'followups') {
        setUserData(prev => ({ ...prev, answers: [...prev.answers, text] }))
        followUpIndexRef.current += 1
        const qList = followUpQuestionsForDisease(userData.disease)
        if (followUpIndexRef.current < qList.length) {
          const nextQ = qList[followUpIndexRef.current]
          pushMessage('assistant', nextQ)
          setAssistantCaption(nextQ)
          speakText(nextQ)
        } else {
          // All answers collected -> pick one medicine, create report, save
          const med = pickBestMedicine(userData.disease)
          const doctorType = suggestDoctorType(userData.disease)
          const report: Report = {
            patientName: userData.name,
            age: userData.age,
            disease: userData.disease,
            doctorType,
            medicine: med,
            precautions: 'Rest, hydrate, avoid self-medication beyond the prescribed medicine. Seek in-person care if symptoms worsen.'
          }
          setLatestReport(report)
          const savingMsg = `I will prepare a prescription for ${med.name} now and save it to your history.`
          pushMessage('assistant', savingMsg)
          setAssistantCaption(savingMsg)
          speakText(savingMsg)
          const saved = await generateMedicalReport(report)
          if (saved?.url) setLatestReport(prev => ({ ...(prev || {}), pdfUrl: saved.url, url: saved.url, filename: saved.filename }))
          const doneMsg = 'Prescription saved. Would you like anything else?'
          pushMessage('assistant', doneMsg)
          setAssistantCaption(doneMsg)
          speakText(doneMsg)
          setStage('confirm')
        }
        return
      }

      // CONFIRM / FALLBACK
      if (stage === 'confirm') {
        const lower = text.toLowerCase()
        if (lower.startsWith('no') || lower.includes('no')) {
          pushMessage('assistant', 'Okay. Take care — get well soon.')
          setAssistantCaption('Okay. Take care — get well soon.')
          speakText('Okay. Take care — get well soon.')
          setStage('ended')
          stopCall()
        } else {
          pushMessage('assistant', 'Tell me what else you would like help with.')
          setAssistantCaption('Tell me what else you would like help with.')
          speakText('Tell me what else you would like help with.')
          // user can start a new flow by stating symptom; we go to ask_disease
          setStage('ask_disease')
        }
        return
      }

      // default fallback
      pushMessage('assistant', 'Sorry — I did not understand. Please repeat.')
      setAssistantCaption('Sorry — I did not understand. Please repeat.')
      speakText('Sorry — I did not understand. Please repeat.')
    } catch (err) {
      console.error(err)
    } finally {
      setIsThinking(false)
    }
  }, [stage, userData, followUpQuestionsForDisease, pickBestMedicine, generateMedicalReport, pushMessage, speakText, suggestDoctorType, stopRecognition, startRecognition, stopCall])

  useEffect(() => () => { stopRecognition() }, [stopRecognition])

  return (
    <div className="p-5 border-2 rounded-xl bg-secondary">
      <div className="flex items-center justify-between">
        <h2 className="p-1 px-2 border rounded-md flex items-center gap-2">
          {isCallActive ? (<><Circle className="text-green-500 animate-pulse" /> Connected</>) : (<><Circle /> Not Connected</>)}
        </h2>
        <div className="flex items-center gap-4">
          <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 mt-10 justify-center">
        <div className="w-[100px] h-[100px] bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-400">AI</span>
        </div>

        <div className="flex flex-col items-center justify-center">
          <h2 className="text-lg font-bold mt-2">AI Medical Agent</h2>
          <ConversationDisplay messages={messages} userCaption={userCaption} assistantCaption={assistantCaption} isCallActive={isCallActive} isListening={isListening} isSpeaking={isSpeaking} isThinking={isThinking} />

          {!isCallActive ? (
            <div className="flex gap-4 mt-6">
              <Button onClick={startCall} className="flex items-center">
                <PhoneCall className="w-4 h-4 mr-2" /> Start Call
              </Button>
              <Button className="flex items-center bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = '/history'}>
                Get Medical Report
              </Button>
            </div>
          ) : (
            <Button className="mt-6 flex items-center justify-center bg-red-500 hover:bg-red-600" onClick={stopCall}>
              <StopCircle className="w-4 h-4 mr-2" /> End Call
            </Button>
          )}
        </div>
      </div>

      {latestReport && (
        <section className="mt-6 border rounded p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Prescription</h3>
          <div className="text-sm">
            <div><strong>Patient:</strong> {latestReport.patientName ?? 'Patient'}</div>
            <div><strong>Age:</strong> {latestReport.age ?? '—'}</div>
            <div className="mt-2"><strong>Disease / Symptom:</strong> {latestReport.disease}</div>
            {latestReport.medicine && (
              <div className="mt-3">
                <div><strong>Medicine:</strong> {latestReport.medicine.name}</div>
                <div><strong>Dosage:</strong> {latestReport.medicine.dosage}</div>
                <div><strong>Instructions:</strong> {latestReport.medicine.instructions}</div>
                <div><strong>Duration:</strong> {latestReport.medicine.duration}</div>
              </div>
            )}
            {latestReport.pdfUrl && (
              <div className="mt-4">
                <a href={latestReport.pdfUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-blue-600 text-white rounded">Open / Download PDF</a>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
