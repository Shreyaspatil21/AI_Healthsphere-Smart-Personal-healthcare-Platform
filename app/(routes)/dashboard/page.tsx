import React from 'react'
import Link from 'next/link'
<<<<<<< HEAD
=======
import HistoryList from './_components/HistoryList'
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
import DoctorsList from './_components/DoctorsList'
import AddNewSession from './_components/AddNewSession'

function Dashboard() {
  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Dashboard</h2>
<<<<<<< HEAD
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
=======
        <div className="flex gap-4">
          <Link href="/history" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            View History
          </Link>
          <AddNewSession />
        </div>
      </div>
      <HistoryList />
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
      <DoctorsList />
    </div>
  )
}

export default Dashboard
