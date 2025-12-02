<<<<<<< HEAD
"use client"
import React from 'react'
import HistoryList from '../_components/HistoryList'

export default function HistoryPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Session History</h2>
      </div>
      <HistoryList />
    </div>
  )
}
=======
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
// logo removed because it caused build/runtime issues

type Session = {
  id: number;
  sessionId: string;
  notes: string;
  createdOn: string;
  report?: string;
  selectedDocter?: { name?: string };
  patientName?: string;
  patientAge?: number;
  disease?: string;
  precautions?: string;
  medicines?: Array<{ name: string; dosage: string; instructions: string; duration: string }>;
};

const HistoryPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/history');
      setSessions(response.data);
    } catch (err) {
      setError('Failed to load history. Please check your connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (sessionId: string) => {
    setIsReportLoading(true);
    try {
      const response = await axios.post('/api/report', { sessionId });
      setSelectedSession(response.data);
    } catch (error) {
      alert('Could not generate report. Please try again later.');
    } finally {
      setIsReportLoading(false);
      fetchHistory(); // Refresh the history to show the new report
    }
  };

  const handleDownloadPdf = () => {
    const reportElement = document.getElementById('report-content');
    if (!reportElement) return;

    const pdf = new jsPDF('p', 'mm', 'a4');

    // Title and date (logo removed)
    pdf.setFontSize(18);
    pdf.text('Medical Report', 14, 20);
    pdf.setFontSize(11);
    pdf.text(`Date: ${new Date().toLocaleString()}`, 14, 28);

    // Patient details
    pdf.setFontSize(13);
    pdf.text('Patient Details:', 14, 40);
    pdf.setFontSize(11);
    pdf.text(`Name: ${selectedSession?.patientName || 'N/A'}`, 14, 48);
    pdf.text(`Age: ${selectedSession?.patientAge || 'N/A'}`, 14, 56);
    pdf.text(`Disease: ${selectedSession?.disease || 'N/A'}`, 14, 64);

    // Precautions
    pdf.setFontSize(13);
    pdf.text('Precautions:', 14, 76);
    pdf.setFontSize(11);
    const precautions = selectedSession?.precautions || 'N/A';
    pdf.text(pdf.splitTextToSize(precautions, 180), 14, 84);

    // Medicines
    pdf.setFontSize(13);
    const medsStartY = 84 + (Array.isArray(selectedSession?.medicines) ? (selectedSession!.medicines!.length * 6) : 6);
    pdf.text('Medicines:', 14, medsStartY + 8);
    pdf.setFontSize(11);
    (selectedSession?.medicines || []).forEach((medicine, index) => {
      const y = medsStartY + 16 + index * 8;
      const medLine = `${index + 1}. ${medicine.name} — ${medicine.dosage} — ${medicine.instructions} — Duration: ${medicine.duration}`;
      pdf.text(pdf.splitTextToSize(medLine, 180), 14, y);
    });

    // Format filename and save
    const disease = (selectedSession?.disease || 'Report').replace(/[:\\/\\?<>\\*|"\\']/g, '-')
      .replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().replace(/[:]/g, '-');
    const filename = `${disease}_${timestamp}.pdf`;
    pdf.save(filename);
  };

  if (loading) return <div className="p-8">Loading history...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Conversation History</h1>
        {sessions.length === 0 ? (
          <p>You have no saved sessions.</p>
        ) : (
          <ul className="space-y-4">
            {sessions.map((session) => (
              <li key={session.id} className="p-4 border rounded-lg shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-semibold">Session: {session.sessionId}</p>
                  <p className="text-sm text-gray-600">Doctor: {session.selectedDocter?.name || 'N/A'}</p>
                  <p className="text-xs text-gray-400">Date: {new Date(session.createdOn).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => session.report ? setSelectedSession(session) : handleGenerateReport(session.sessionId)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                  disabled={isReportLoading}
                >
                  {isReportLoading ? 'Generating...' : (session.report ? 'View Report' : 'Generate Report')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Report Viewing Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full">
            <div id="report-content" className="prose">
              <h2 className="text-2xl font-bold mb-4">Medical Report</h2>
              <pre className="whitespace-pre-wrap font-sans bg-gray-50 p-4 rounded">{selectedSession.report}</pre>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button onClick={() => setSelectedSession(null)} className="px-4 py-2 rounded bg-gray-200">Close</button>
              <button onClick={handleDownloadPdf} className="px-4 py-2 rounded bg-green-500 text-white">Download as PDF</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HistoryPage;
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
