import React from 'react'
import Link from 'next/link'
import DoctorsList from './_components/DoctorsList'
import AddNewSession from './_components/AddNewSession'

function Dashboard() {
  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Dashboard</h2>
        <AddNewSession />
      </div>
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Session History</h3>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/history" className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-white">View History</Link>
          </div>
        </div>
      </div>
      <DoctorsList />
    </div>
  )
}

export default Dashboard
