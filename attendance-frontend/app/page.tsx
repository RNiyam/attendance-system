'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, UserPlus, Clock, CheckCircle, XCircle, Loader2, X, User, LogOut } from 'lucide-react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<'register' | 'checkin'>('checkin')
  const [empCode, setEmpCode] = useState('')
  const [empName, setEmpName] = useState('')
  const [videoReady, setVideoReady] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [employeeAttendance, setEmployeeAttendance] = useState<any[]>([])
  const [allEmployees, setAllEmployees] = useState<any[]>([])
  const [showAllEmployeesModal, setShowAllEmployeesModal] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (token && user.onboarding_completed) {
      // Redirect to appropriate dashboard
      if (user.role === 'admin') {
        router.push('/admin-dashboard')
      } else {
        router.push('/dashboard')
      }
      return
    }
    
    loadAttendanceRecords()
    loadStats()
    return () => {
      stopCamera()
    }
  }, [router])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setVideoReady(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setMessage({ type: 'error', text: 'Failed to access camera. Please check permissions.' })
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setVideoReady(false)
  }

  const captureImage = (): string | null => {
    if (!videoRef.current) return null
    
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return null
    
    ctx.drawImage(videoRef.current, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.8)
  }

  const handleRegister = async () => {
    const trimmedCode = empCode.trim()
    const trimmedName = empName.trim()

    if (!trimmedCode && !trimmedName) {
      setMessage({ type: 'error', text: 'Please enter employee code and name' })
      return
    }
    if (!trimmedCode) {
      setMessage({ type: 'error', text: 'Please enter employee code' })
      return
    }
    if (!trimmedName) {
      setMessage({ type: 'error', text: 'Please enter employee name' })
      return
    }

    if (!videoReady) {
      setMessage({ type: 'error', text: 'Please start camera first' })
      return
    }

    setLoading(true)
    setMessage(null)
    setCapturing(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for better capture
      const image = captureImage()
      
      if (!image) {
        throw new Error('Failed to capture image')
      }

      const response = await axios.post(`${API_URL}/api/employee/register`, {
        empCode: trimmedCode,
        name: trimmedName,
        image
      })

      setMessage({ type: 'success', text: `Employee ${empName} registered successfully!` })
      setEmpCode('')
      setEmpName('')
      loadStats()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Registration failed. Please try again.'
      })
    } finally {
      setLoading(false)
      setCapturing(false)
    }
  }

  const handleCheckIn = async () => {
    const trimmedCode = empCode.trim()

    if (!trimmedCode) {
      setMessage({ type: 'error', text: 'Please enter employee code' })
      return
    }

    if (!videoReady) {
      setMessage({ type: 'error', text: 'Please start camera first' })
      return
    }

    setLoading(true)
    setMessage(null)
    setCapturing(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for better capture
      const image = captureImage()
      
      if (!image) {
        throw new Error('Failed to capture image')
      }

      const response = await axios.post(`${API_URL}/api/attendance/checkin`, {
        empCode: trimmedCode,
        image
      })

      setMessage({
        type: 'success',
        text: `${response.data.employee.name} - ${response.data.status} (Confidence: ${(response.data.confidence * 100).toFixed(1)}%)`
      })
      setEmpCode('')
      loadAttendanceRecords()
      loadStats()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Check-in failed. Please try again.'
      })
    } finally {
      setLoading(false)
      setCapturing(false)
    }
  }

  const loadAttendanceRecords = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/attendance?limit=10`)
      setAttendanceRecords(response.data)
    } catch (error) {
      console.error('Error loading attendance:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/attendance/stats`)
      setStats(response.data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleEmployeeClick = async (empCode: string) => {
    try {
      // Get employee details
      const empResponse = await axios.get(`${API_URL}/api/employee/${empCode}`)
      setSelectedEmployee(empResponse.data)
      
      // Get employee attendance history
      const attResponse = await axios.get(`${API_URL}/api/attendance?empCode=${empCode}&limit=50`)
      setEmployeeAttendance(attResponse.data)
      
      setShowEmployeeModal(true)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to load employee details'
      })
    }
  }

  const handleTotalEmployeesClick = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/employees`)
      setAllEmployees(response.data)
      setShowAllEmployeesModal(true)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to load employees'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
              Face Recognition Attendance System
            </h1>
            <p className="text-gray-600">AI-powered attendance tracking</p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition shadow-sm"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </header>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div 
              onClick={handleTotalEmployeesClick}
              className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition cursor-pointer"
              style={{ '--hover-bg': 'rgba(34, 20, 97, 0.05)' } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(34, 20, 97, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <div className="text-sm text-gray-600">Total Employees</div>
              <div className="text-2xl font-bold" style={{ color: '#221461' }}>{stats.total_employees}</div>
              <div className="text-xs text-gray-500 mt-1">Click to view all</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Records</div>
              <div className="text-2xl font-bold text-green-600">{stats.total_records}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Check-ins</div>
              <div className="text-2xl font-bold text-purple-600">{stats.total_checkins}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Check-outs</div>
              <div className="text-2xl font-bold text-orange-600">{stats.total_checkouts}</div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Panel - Camera & Controls */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => {
                  setMode('checkin')
                  setMessage(null)
                  setEmpCode('')
                  setEmpName('')
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  mode === 'checkin'
                    ? 'text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Clock className="inline mr-2" size={18} />
                Check In/Out
              </button>
              <button
                onClick={() => {
                  setMode('register')
                  setMessage(null)
                  setEmpCode('')
                  setEmpName('')
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  mode === 'register'
                    ? 'text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <UserPlus className="inline mr-2" size={18} />
                Register
              </button>
            </div>

            {/* Video Feed */}
            <div className="relative bg-black rounded-lg overflow-hidden mb-4 aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full ${capturing ? 'opacity-50' : ''}`}
              />
              {!videoReady && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Camera not started</p>
                  </div>
                </div>
              )}
              {capturing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-full p-4">
                    <Loader2 className="animate-spin" size={32} style={{ color: '#221461' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={videoReady ? stopCamera : startCamera}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  videoReady
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <Camera className="inline mr-2" size={18} />
                {videoReady ? 'Stop Camera' : 'Start Camera'}
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Code
                </label>
                <input
                  type="text"
                  value={empCode}
                  onChange={(e) => {
                    setEmpCode(e.target.value)
                    if (message) setMessage(null)
                  }}
                  placeholder="e.g., EMP001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={empName}
                    onChange={(e) => {
                      setEmpName(e.target.value)
                      if (message) setMessage(null)
                    }}
                    placeholder="e.g., John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
              )}

              <button
                onClick={mode === 'register' ? handleRegister : handleCheckIn}
                disabled={loading || !videoReady}
                className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition ${
                  loading || !videoReady
                    ? 'bg-gray-400 cursor-not-allowed'
                    : mode === 'register'
                    ? 'bg-green-600 hover:bg-green-700'
                    : ''
                }`}
                style={!loading && videoReady && mode !== 'register' ? { backgroundColor: '#221461' } : {}}
                onMouseEnter={(e) => {
                  if (!loading && videoReady && mode !== 'register') {
                    e.currentTarget.style.backgroundColor = '#1a1049'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && videoReady && mode !== 'register') {
                    e.currentTarget.style.backgroundColor = '#221461'
                  }
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="inline mr-2 animate-spin" size={18} />
                    Processing...
                  </>
                ) : mode === 'register' ? (
                  <>
                    <UserPlus className="inline mr-2" size={18} />
                    Register Employee
                  </>
                ) : (
                  <>
                    <CheckCircle className="inline mr-2" size={18} />
                    Mark Attendance
                  </>
                )}
              </button>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle size={20} />
                ) : (
                  <XCircle size={20} />
                )}
                <span>{message.text}</span>
              </div>
            )}
          </div>

          {/* Right Panel - Recent Attendance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Attendance</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {attendanceRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No attendance records yet</p>
              ) : (
                attendanceRecords.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => handleEmployeeClick(record.emp_code)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">{record.name}</div>
                      <div className="text-sm text-gray-600">{record.emp_code}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(record.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          record.status === 'IN'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {record.status}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {(record.confidence * 100).toFixed(1)}% match
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Details Modal */}
      {showEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 20, 97, 0.1)' }}>
                  <User size={24} style={{ color: '#221461' }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedEmployee.name}</h2>
                  <p className="text-sm text-gray-600">Employee Code: {selectedEmployee.emp_code}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEmployeeModal(false)
                  setSelectedEmployee(null)
                  setEmployeeAttendance([])
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Employee Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Employee Code</div>
                    <div className="text-lg font-semibold text-gray-800">{selectedEmployee.emp_code}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Name</div>
                    <div className="text-lg font-semibold text-gray-800">{selectedEmployee.name}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Registered On</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {new Date(selectedEmployee.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Total Attendance Records</div>
                    <div className="text-lg font-semibold text-gray-800">{employeeAttendance.length}</div>
                  </div>
                </div>
              </div>

              {/* Attendance History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance History</h3>
                {employeeAttendance.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No attendance records yet</p>
                ) : (
                  <div className="space-y-3">
                    {employeeAttendance.map((record: any) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                record.status === 'IN'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {record.status}
                            </span>
                            <div>
                              <div className="text-sm font-medium text-gray-800">
                                {new Date(record.created_at).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                Confidence: {(record.confidence * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Employees Modal */}
      {showAllEmployeesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 20, 97, 0.1)' }}>
                  <User size={24} style={{ color: '#221461' }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">All Employees</h2>
                  <p className="text-sm text-gray-600">{allEmployees.length} employee(s) registered</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAllEmployeesModal(false)
                  setAllEmployees([])
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {allEmployees.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No employees registered yet</p>
              ) : (
                <div className="space-y-3">
                  {allEmployees.map((employee: any) => (
                    <div
                      key={employee.id}
                      onClick={() => {
                        setShowAllEmployeesModal(false)
                        handleEmployeeClick(employee.emp_code)
                      }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{employee.name}</div>
                          <div className="text-sm text-gray-600">Code: {employee.emp_code}</div>
                          <div className="text-xs text-gray-500">
                            Registered: {new Date(employee.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ color: '#221461' }}>
                        <CheckCircle size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
