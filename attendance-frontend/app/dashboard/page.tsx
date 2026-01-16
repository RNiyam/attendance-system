'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { 
  Calendar, Clock, CheckCircle, XCircle, Bell, Search, 
  Settings, LogOut, User, Menu, X, Coffee, TrendingUp, 
  TrendingDown, FileText, Users, Briefcase, MapPin, MoreVertical,
  UtensilsCrossed, Circle, GripVertical, Camera
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function Dashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeBreak, setActiveBreak] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [hoveredTask, setHoveredTask] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showClockOutModal, setShowClockOutModal] = useState(false)
  const [clockOutVideoReady, setClockOutVideoReady] = useState(false)
  const [clockOutCapturing, setClockOutCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    loadDashboardData()
    
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timeInterval)
  }, [router])

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/dashboard/employee`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      let data = response.data.data
      
      // Add dummy tasks if no tasks exist
      if (!data.tasks || data.tasks.length === 0) {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        data.tasks = [
          {
            id: 1,
            title: 'Making work certificate John Doe',
            description: 'Binne',
            due_date: tomorrow.toISOString().split('T')[0],
            status: 'in_progress',
            priority: 'high'
          },
          {
            id: 2,
            title: 'For technician review',
            description: 'Office',
            due_date: today.toISOString().split('T')[0],
            status: 'pending',
            priority: 'medium'
          },
          {
            id: 3,
            title: 'Call Jack Russel',
            description: 'Phone call',
            due_date: today.toISOString().split('T')[0],
            status: 'pending',
            priority: 'medium'
          },
          {
            id: 4,
            title: 'Call Jack Russel',
            description: 'Follow up call',
            due_date: today.toISOString().split('T')[0],
            status: 'pending',
            priority: 'low'
          }
        ]
      }
      
      setDashboardData(data)
      
      // Store employee ID if available - try to get from profile
      if (!localStorage.getItem('employeeId')) {
        try {
          const profileResponse = await axios.get(`${API_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const empId = profileResponse.data?.user?.employee_id
          if (empId) {
            localStorage.setItem('employeeId', empId)
            console.log('Stored employee ID:', empId)
          }
        } catch (err) {
          console.error('Could not fetch employee ID from profile:', err)
        }
      }
      
      // Check for active break
      if (data.breaks && data.breaks.length > 0) {
        const latestBreak = data.breaks[0]
        if (!latestBreak.break_end) {
          setActiveBreak(latestBreak)
        }
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      if (error.response?.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const startClockOutCamera = async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      setClockOutVideoReady(false)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setClockOutVideoReady(true)
        }
        // Fallback in case onloadedmetadata doesn't fire
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            setClockOutVideoReady(true)
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Failed to access camera. Please check permissions.')
      setShowClockOutModal(false)
    }
  }

  const stopClockOutCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setClockOutVideoReady(false)
  }

  const captureClockOutImage = (): string | null => {
    if (!videoRef.current) return null
    
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return null
    
    ctx.drawImage(videoRef.current, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.8)
  }

  const handleClockOutClick = () => {
    setShowClockOutModal(true)
  }

  // Start camera when modal opens and video element is ready
  useEffect(() => {
    if (showClockOutModal) {
      // Small delay to ensure modal and video element are rendered
      const timer = setTimeout(() => {
        if (videoRef.current) {
          startClockOutCamera()
        }
      }, 100)
      return () => {
        clearTimeout(timer)
        if (!showClockOutModal) {
          stopClockOutCamera()
        }
      }
    } else {
      stopClockOutCamera()
    }
  }, [showClockOutModal])

  const handleClockOut = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Not authenticated')
        return
      }

      if (!clockOutVideoReady) {
        alert('Please wait for camera to be ready')
        return
      }

      // Get employee ID from profile
      let empCode = localStorage.getItem('employeeId')
      
      if (!empCode) {
        // Fetch from profile API
        try {
          const profileResponse = await axios.get(`${API_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          empCode = profileResponse.data?.user?.employee_id || 
                   profileResponse.data?.data?.employee_id ||
                   profileResponse.data?.employee_id
          
          if (empCode) {
            localStorage.setItem('employeeId', empCode)
          } else {
            alert('Employee ID not found in profile. Please complete your onboarding.')
            stopClockOutCamera()
            setShowClockOutModal(false)
            return
          }
        } catch (profileError: any) {
          console.error('Error fetching profile:', profileError)
          alert(profileError.response?.data?.error || 'Failed to fetch employee ID. Please try again.')
          stopClockOutCamera()
          setShowClockOutModal(false)
          return
        }
      }

      if (!empCode) {
        alert('Employee ID not found. Please complete your profile.')
        stopClockOutCamera()
        setShowClockOutModal(false)
        return
      }

      // Capture face image
      setClockOutCapturing(true)
      await new Promise(resolve => setTimeout(resolve, 500))
      const image = captureClockOutImage()
      
      if (!image) {
        throw new Error('Failed to capture image')
      }

      // Clock out with face verification
      await axios.post(`${API_URL}/api/attendance/clockout`, {
        empCode,
        image
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      stopClockOutCamera()
      setShowClockOutModal(false)
      setClockOutCapturing(false)
      loadDashboardData()
      alert('Clock out successful!')
    } catch (error: any) {
      console.error('Clock out error:', error)
      setClockOutCapturing(false)
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to clock out')
    }
  }

  const handleStartBreak = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_URL}/api/dashboard/break/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadDashboardData()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to start break')
    }
  }

  const handleEndBreak = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_URL}/api/dashboard/break/end`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setActiveBreak(null)
      loadDashboardData()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to end break')
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    const prevMonth = new Date(year, month - 1, 0)
    const prevMonthDays = prevMonth.getDate()

    const days = []
    // Add days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false })
    }
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true })
    }
    // Add days from next month to fill the grid (42 cells for 6 weeks)
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ day, isCurrentMonth: false })
    }
    return days
  }

  const hasEventOnDate = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth || !dashboardData?.schedule) return false
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    return dashboardData.schedule.some((event: any) => {
      const eventDate = new Date(event.start_time || event.event_date)
      const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`
      return eventDateStr === dateStr
    })
  }

  const getSelectedDateEvents = () => {
    if (!dashboardData?.schedule) return []
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const day = selectedDate.getDate()
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    return dashboardData.schedule.filter((event: any) => {
      const eventDate = new Date(event.start_time || event.event_date)
      const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`
      return eventDateStr === dateStr
    })
  }

  const isSelectedDate = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return false
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === currentMonth.getMonth() &&
           selectedDate.getFullYear() === currentMonth.getFullYear()
  }

  const handleDateClick = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    setSelectedDate(new Date(year, month, day))
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
  const todayAttendance = dashboardData?.todayAttendance
  const isClockedIn = todayAttendance?.status === 'IN'

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
                return `${greeting}, ${user.name || 'User'}`
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
                {user.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium">{user.name || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Dashboard</h2>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Attendance Days */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData?.kpis?.totalAttendanceDays || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={24} className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* On-Time Rate */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">On-Time Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData?.kpis?.onTimeRate || 0}%</p>
                  <p className="text-xs text-gray-500 mt-1">{dashboardData?.kpis?.onTimeArrivals || 0} on-time / {dashboardData?.kpis?.lateArrivals || 0} late</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp size={24} className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Total Hours Worked */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData?.kpis?.totalHoursWorked || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Avg: {dashboardData?.kpis?.avgHoursPerDay || 0} hrs/day</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock size={24} className="text-purple-600" />
                </div>
              </div>
            </div>

            {/* Overtime Hours */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overtime</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData?.kpis?.overtimeHours || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Hours (last 30 days)</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp size={24} className="text-orange-600" />
                </div>
              </div>
            </div>

            {/* This Week Attendance */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData?.kpis?.thisWeekAttendance || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Days attended</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Calendar size={24} className="text-indigo-600" />
                </div>
              </div>
            </div>

            {/* Late Arrivals */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Late Arrivals</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData?.kpis?.lateArrivals || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle size={24} className="text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Clock In/Out Widget */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Clock In / Out</h3>
                <Settings size={18} className="text-gray-400" />
              </div>
              
              {/* Date and Status */}
              <div className="mb-6 flex items-center gap-2">
                {isClockedIn ? (
                  <CheckCircle size={18} className="text-gray-600" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
                )}
                <p className="text-sm text-gray-600">
                  Clock {currentTime.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Clock In/Out Times in Input Fields */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                  <label className="text-xs text-gray-600 block mb-1">Clock In</label>
                  <input
                    type="text"
                    value={isClockedIn ? (todayAttendance?.clock_in_time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()) : '-'}
                    readOnly
                    className="w-full bg-transparent text-sm font-semibold text-gray-900 border-none outline-none"
                  />
                </div>
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                  <label className="text-xs text-gray-600 block mb-1">Clock Out</label>
                  <input
                    type="text"
                    value="-"
                    readOnly
                    className="w-full bg-transparent text-sm font-semibold text-gray-900 border-none outline-none"
                  />
                </div>
              </div>

              {/* Lunch Break */}
              <div className="text-center mb-6">
                <UtensilsCrossed size={20} className="text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Lunch Break</p>
                <p className="text-sm font-medium text-gray-900">12:00 - 01:30 pm</p>
              </div>

              {/* Current Time and Break Time */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 tracking-wider font-mono mb-1">
                    {String(currentTime.getHours()).padStart(2, '0')}:{String(currentTime.getMinutes()).padStart(2, '0')}:{String(currentTime.getSeconds()).padStart(2, '0')}
                  </div>
                  <p className="text-xs text-gray-500">Current time</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 tracking-wider font-mono mb-1">-</div>
                  <p className="text-xs text-gray-500">Break time</p>
                </div>
              </div>

              {/* Action Buttons */}
              {isClockedIn ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleClockOutClick}
                    className="bg-gray-900 text-white py-2.5 px-4 rounded-lg hover:bg-gray-800 transition font-semibold flex items-center justify-center gap-2"
                  >
                    Clock Out
                    <span>→</span>
                  </button>
                  {!activeBreak ? (
                    <button
                      onClick={handleStartBreak}
                      className="bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      <Coffee size={18} />
                      Start Break
                    </button>
                  ) : (
                    <button
                      onClick={handleEndBreak}
                      className="bg-orange-100 text-orange-700 py-2.5 px-4 rounded-lg hover:bg-orange-200 transition"
                    >
                      End Break
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-gray-900 text-white py-2.5 px-4 rounded-lg hover:bg-gray-800 transition font-semibold"
                >
                  Clock In
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Clock Out Face Verification Modal */}
      {showClockOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Clock Out - Face Verification</h3>
              <button
                onClick={() => {
                  stopClockOutCamera()
                  setShowClockOutModal(false)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ display: clockOutVideoReady ? 'block' : 'none' }}
                />
                {!clockOutVideoReady && (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <Camera size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Starting camera...</p>
                    </div>
                  </div>
                )}
                {clockOutCapturing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                      <p>Capturing...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  stopClockOutCamera()
                  setShowClockOutModal(false)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={clockOutCapturing}
              >
                Cancel
              </button>
              <button
                onClick={handleClockOut}
                disabled={!clockOutVideoReady || clockOutCapturing}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {clockOutCapturing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Clocking Out...
                  </>
                ) : (
                  <>
                    <Camera size={18} />
                    Clock Out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
