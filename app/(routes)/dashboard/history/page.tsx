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
