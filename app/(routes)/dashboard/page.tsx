import React from 'react'
import Link from 'next/link'
import HistoryList from './_components/HistoryList'
import DoctorsList from './_components/DoctorsList'
import AddNewSession from './_components/AddNewSession'

function Dashboard() {
  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Dashboard</h2>
        <div className="flex gap-4">
          <Link href="/history" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            View History
          </Link>
          <AddNewSession />
        </div>
      </div>
      <HistoryList />
      <DoctorsList />
    </div>
  )
}

export default Dashboard
