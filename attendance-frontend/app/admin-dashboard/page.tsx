'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { 
  Calendar, Clock, Bell, Search, Settings, LogOut, 
  User, Menu, Users, FileText, Briefcase, MapPin,
  CheckCircle, XCircle, TrendingUp
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminDashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!token) {
      router.push('/login')
      return
    }
    
    if (user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    
    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/dashboard/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDashboardData(response.data.data)
    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      if (error.response?.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApproveLeave = async (id: number) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`${API_URL}/api/dashboard/leave/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadDashboardData()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to approve leave')
    }
  }

  const handleRejectLeave = async (id: number) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`${API_URL}/api/dashboard/leave/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadDashboardData()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to reject leave')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('employeeId')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    )
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-gray-800">
          <h2 className={`${sidebarOpen ? 'block' : 'hidden'} text-xl font-bold`}>Time Track</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
            <Briefcase size={20} />
            {sidebarOpen && <span>Dashboard</span>}
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg">
            <Calendar size={20} />
            {sidebarOpen && <span>Calendar</span>}
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg">
            <Users size={20} />
            {sidebarOpen && <span>Company</span>}
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg">
            <MapPin size={20} />
            {sidebarOpen && <span>Planning</span>}
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg">
            <FileText size={20} />
            {sidebarOpen && <span>Leave Request</span>}
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg">
            <Clock size={20} />
            {sidebarOpen && <span>Time Track</span>}
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg">
            <Settings size={20} />
            {sidebarOpen && <span>Settings</span>}
          </a>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg w-full text-left text-red-400 hover:text-red-300 transition"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {(() => {
                const hour = new Date().getHours()
                let greeting = 'Good morning'
                if (hour >= 12 && hour < 17) {
                  greeting = 'Good afternoon'
                } else if (hour >= 17 && hour < 21) {
                  greeting = 'Good evening'
                } else if (hour >= 21 || hour < 5) {
                  greeting = 'Good night'
                }
                return `${greeting}, ${user.name || 'Admin'}`
              })()}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for anything..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell size={20} className="text-gray-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name?.charAt(0) || 'A'}
              </div>
              <span className="text-sm font-medium">{user.name || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Total Employees</p>
              <p className="text-3xl font-bold">{dashboardData?.stats?.total_employees || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Today's Records</p>
              <p className="text-3xl font-bold text-blue-600">{dashboardData?.stats?.total_records || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Check-ins</p>
              <p className="text-3xl font-bold text-green-600">{dashboardData?.stats?.checkins || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Late Arrivals</p>
              <p className="text-3xl font-bold text-red-600">{dashboardData?.stats?.late_count || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Leave Requests */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Leave Request Pending ({dashboardData?.pendingLeaves?.length || 0})</h3>
                <button className="text-sm text-blue-600">View All</button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData?.pendingLeaves?.map((leave: any) => (
                  <div key={leave.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{leave.employee_name}</p>
                        <p className="text-sm text-gray-600">{leave.employee_email}</p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        {leave.leave_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                      <span className="ml-2">({leave.days_count} days)</span>
                    </p>
                    {leave.reason && <p className="text-sm text-gray-500 mb-3">{leave.reason}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveLeave(leave.id)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectLeave(leave.id)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {(!dashboardData?.pendingLeaves || dashboardData.pendingLeaves.length === 0) && (
                  <p className="text-center text-gray-500 py-8">No pending leave requests</p>
                )}
              </div>
            </div>

            {/* Recent Attendance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData?.recentAttendance?.map((record: any) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-semibold">{record.name}</p>
                      <p className="text-sm text-gray-600">{record.emp_code}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(record.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      record.status === 'IN' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                ))}
                {(!dashboardData?.recentAttendance || dashboardData.recentAttendance.length === 0) && (
                  <p className="text-center text-gray-500 py-8">No recent attendance records</p>
                )}
              </div>
            </div>

            {/* All Employees */}
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">All Employees ({dashboardData?.employees?.length || 0})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {dashboardData?.employees?.map((emp: any) => (
                  <div key={emp.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="font-semibold">{emp.name || emp.emp_code}</p>
                        <p className="text-xs text-gray-600">{emp.emp_code}</p>
                      </div>
                    </div>
                    {emp.email && <p className="text-xs text-gray-500">{emp.email}</p>}
                    {emp.mobile_number && <p className="text-xs text-gray-500">{emp.mobile_number}</p>}
                  </div>
                ))}
                {(!dashboardData?.employees || dashboardData.employees.length === 0) && (
                  <p className="text-center text-gray-500 py-8 col-span-full">No employees registered</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
