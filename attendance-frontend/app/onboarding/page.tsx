'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Users, FileText, CheckCircle, Calendar, Camera, Phone, ArrowLeft, ArrowRight, HelpCircle, Info, Check, Loader2 } from 'lucide-react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface OnboardingData {
  phoneNumber: string
  otp: string
  username: string
  profilePhoto: string | null
  gender: string
  dateOfBirth: string
  maritalStatus: string
  policyAgreed: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [employeeId, setEmployeeId] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [capturingFace, setCapturingFace] = useState(false)
  const [faceCaptured, setFaceCaptured] = useState(false)
  
  const [formData, setFormData] = useState<OnboardingData>({
    phoneNumber: '',
    otp: '',
    username: '',
    profilePhoto: null,
    gender: '',
    dateOfBirth: '',
    maritalStatus: '',
    policyAgreed: false
  })

  const steps = [
    {
      id: 1,
      title: 'Personal Information',
      description: 'Add your contact details and profile information to set up your account.',
      icon: User,
      subItems: ['Contact Details', 'Profile Photo']
    },
    {
      id: 2,
      title: 'Additional Details',
      description: 'Provide additional information to complete your profile.',
      icon: Users,
      subItems: ['Personal Info', 'Demographics']
    },
    {
      id: 3,
      title: 'Company Policy',
      description: 'Review and agree to the company policies and terms of service.',
      icon: FileText,
      subItems: ['Policy Review', 'Agreement']
    }
  ]
  
  // Determine which sub-items to show based on current step
  const getSubItemsForStep = (stepId: number) => {
    if (stepId === 1) {
      // Show sub-items based on form progress
      if (formData.phoneNumber && formData.username) {
        return ['Contact Details', 'Profile Photo']
      }
      return ['Contact Details', 'Profile Photo']
    }
    return steps.find(s => s.id === stepId)?.subItems || []
  }

  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSendOTP = async () => {
    if (!formData.phoneNumber) {
      setError('Please enter a phone number')
      return
    }

    // Validate phone number format (10 digits)
    const phoneRegex = /^[0-9]{10}$/
    const cleanPhone = formData.phoneNumber.replace(/\D/g, '')
    
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setError('')
    setSendingOtp(true)
    try {
      const response = await axios.post(`${API_URL}/api/otp/send`, {
        mobileNumber: cleanPhone
      })

      if (response.data.success) {
        setOtpSent(true)
        // Don't reset otpVerified if already verified for this phone number
        if (!otpVerified) {
          setOtpVerified(false)
        }
        setOtpCountdown(60) // 60 second countdown
        // Start countdown timer
        const timer = setInterval(() => {
          setOtpCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to send OTP. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!formData.otp) {
      setError('Please enter OTP')
      return
    }

    if (!formData.phoneNumber) {
      setError('Please enter phone number first')
      return
    }

    // Validate OTP format (4 digits)
    const otpRegex = /^[0-9]{4}$/
    if (!otpRegex.test(formData.otp)) {
      setError('OTP must be 4 digits')
      return
    }

    setError('')
    setVerifyingOtp(true)
    try {
      const cleanPhone = formData.phoneNumber.replace(/\D/g, '')
      const response = await axios.post(`${API_URL}/api/otp/verify`, {
        mobileNumber: cleanPhone,
        otp: formData.otp
      })

      if (response.data.success) {
        setOtpVerified(true)
        setOtpCountdown(0)
        setError('')
        
        // Save phone number to profile after successful verification
        try {
          const token = localStorage.getItem('token')
          if (token) {
            await axios.put(
              `${API_URL}/api/profile`,
              { phoneNumber: cleanPhone },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          }
        } catch (err) {
          console.error('Failed to save phone number:', err)
          // Don't show error to user, phone is still verified
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid OTP. Please try again.')
      setOtpVerified(false)
    } finally {
      setVerifyingOtp(false)
    }
  }

  const startCamera = async () => {
    try {
      setError('')
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      })
      setStream(mediaStream)
      // Set videoReady immediately so video element renders
      setVideoReady(true)
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.')
      setVideoReady(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef) {
      videoRef.srcObject = null
    }
    setVideoReady(false)
  }

  const captureImage = (): string | null => {
    if (!videoRef) return null
    
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.videoWidth
    canvas.height = videoRef.videoHeight
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return null
    
    ctx.drawImage(videoRef, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.8)
  }

  const handleCaptureFace = async () => {
    if (!videoReady || !employeeId) {
      setError('Please start camera and ensure employee ID is available')
      return
    }

    setCapturingFace(true)
    setError('')

    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for better capture
      const image = captureImage()
      
      if (!image) {
        throw new Error('Failed to capture image')
      }

      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Get user name from localStorage
      const userData = localStorage.getItem('user')
      const userName = userData ? JSON.parse(userData).name : formData.username

      // Register face with backend
      const response = await axios.post(
        `${API_URL}/api/employee/register`,
        {
          empCode: employeeId,
          name: userName || formData.username,
          image
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        setFaceCaptured(true)
        setFormData(prev => ({ ...prev, profilePhoto: image }))
        setError('')
        stopCamera()
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to capture face. Please try again.')
      setFaceCaptured(false)
    } finally {
      setCapturingFace(false)
    }
  }

  const handleNext = async () => {
    setError('')
    if (currentStep === 1) {
      if (!formData.phoneNumber || !formData.username) {
        setError('Phone number and username are required')
        return
      }
      if (!otpVerified) {
        setError('Please verify your phone number with OTP first')
        return
      }
      if (!faceCaptured) {
        setError('Please capture your face photo first')
        return
      }
      // Generate/get employee ID after step 1 completion
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_URL}/api/onboarding/employee-id`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.data.success && response.data.employeeId) {
          setEmployeeId(response.data.employeeId)
          localStorage.setItem('employeeId', response.data.employeeId)
        }
      } catch (err) {
        console.error('Failed to get employee ID:', err)
      }
    } else if (currentStep === 2) {
      if (!formData.gender || !formData.dateOfBirth || !formData.maritalStatus) {
        setError('All additional details are required')
        return
      }
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCompleteOnboarding = async () => {
    if (!formData.policyAgreed) {
      setError('Please agree to the company policies')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await axios.post(
        `${API_URL}/api/onboarding/complete`,
        {
          phoneNumber: formData.phoneNumber,
          username: formData.username,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          maritalStatus: formData.maritalStatus,
          profilePhoto: formData.profilePhoto
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        // Update user's onboarding status in localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        user.onboarding_completed = true
        localStorage.setItem('user', JSON.stringify(user))

        // Store employee ID if returned
        if (response.data.employeeId) {
          setEmployeeId(response.data.employeeId)
          localStorage.setItem('employeeId', response.data.employeeId)
        }
        // Redirect to main app
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Onboarding error:', err)
      setError(err.response?.data?.error || 'Failed to complete onboarding. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Get user data from localStorage to autofill username
      const userData = localStorage.getItem('user')
      let userName = ''
      if (userData) {
        try {
          const user = JSON.parse(userData)
          userName = user.name || ''
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }

      // Fetch employee ID immediately
      try {
        const employeeIdResponse = await axios.get(`${API_URL}/api/onboarding/employee-id`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (employeeIdResponse.data.success && employeeIdResponse.data.employeeId) {
          setEmployeeId(employeeIdResponse.data.employeeId)
          localStorage.setItem('employeeId', employeeIdResponse.data.employeeId)
        }
      } catch (err) {
        console.error('Failed to fetch employee ID:', err)
      }

      try {
        const response = await axios.get(`${API_URL}/api/onboarding/status`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.data.completed) {
          // Already completed, redirect to main app
          router.push('/dashboard')
          return
        }

        // Set current step based on progress
        if (response.data.currentStep) {
          setCurrentStep(response.data.currentStep)
        }

        // Fetch existing profile data if any
        try {
          const profileResponse = await axios.get(`${API_URL}/api/onboarding/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (profileResponse.data.profile) {
            const profile = profileResponse.data.profile
            setFormData({
              phoneNumber: profile.phone_number || '',
              otp: '',
              username: profile.username || userName || '',
              profilePhoto: profile.profile_photo || null,
              gender: profile.gender || '',
              dateOfBirth: profile.date_of_birth || '',
              maritalStatus: profile.marital_status || '',
              policyAgreed: false
            })
            // Set employee ID if it exists in profile
            if (profile.employee_id) {
              setEmployeeId(profile.employee_id)
              localStorage.setItem('employeeId', profile.employee_id)
            }
          } else {
            // No profile exists yet, autofill username from signup
            if (userName) {
              setFormData(prev => ({
                ...prev,
                username: userName
              }))
            }
          }
        } catch (profileError) {
          // Profile doesn't exist yet, autofill username from signup
          if (userName) {
            setFormData(prev => ({
              ...prev,
              username: userName
            }))
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      } finally {
        setPageLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [router])

  const isStepComplete = (stepId: number) => {
    switch (stepId) {
      case 1:
        return formData.phoneNumber && formData.username && otpVerified && faceCaptured
      case 2:
        return formData.gender && formData.dateOfBirth && formData.maritalStatus
      case 3:
        return formData.policyAgreed
      default:
        return false
    }
  }

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef && stream) {
      videoRef.srcObject = stream
    }
  }, [stream, videoRef])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Left Sidebar - Progress Indicator */}
        <div className="w-80 border-r border-[#221461]/20 p-8 flex flex-col" style={{ backgroundColor: '#221461' }}>
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-white">Time Track</span>
              </div>
            </div>
            {/* Divider Line */}
            <div className="h-px bg-white/20 w-full"></div>
          </div>

          {/* Progress Steps */}
          <div className="flex-1 space-y-8">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id || isStepComplete(step.id)
              
              return (
                <div key={step.id} className="relative">
                  <div className="flex items-start gap-3">
                    {/* Step Number Circle or Checkmark */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <Check size={20} className="text-green-400" strokeWidth={3} />
                      ) : (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          isActive
                            ? 'bg-white'
                            : 'bg-white/20 text-white/60'
                        }`} style={isActive ? { color: '#221461' } : {}}>
                          {step.id}
                        </div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <h3 className={`text-base font-medium ${
                        isActive 
                          ? 'text-white' 
                          : isCompleted 
                          ? 'text-white/60' 
                          : 'text-white/60'
                      }`}>
                        {step.title.toUpperCase()}
                      </h3>
                      {/* Sub-items for active step */}
                      {isActive && step.subItems && step.subItems.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {step.subItems.map((subItem, subIndex) => (
                            <div key={subIndex} className="flex items-center justify-between w-full">
                              <span className={`text-sm font-normal ${
                                subIndex === 0 ? 'text-white' : 'text-white/70'
                              }`}>
                                {subItem}
                              </span>
                              {subIndex === 0 && (
                                <ArrowRight size={14} className="text-white/70 flex-shrink-0 ml-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Employee ID */}
          <div className="mt-auto p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <label className="text-sm font-medium text-white/70 mb-1 block">Employee ID</label>
            <div className="text-base font-bold text-white">
              {employeeId || 'EMP0001'}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-8">
            {/* White Card Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {steps[currentStep - 1].title}
                  </h1>
                  <p className="text-gray-600">
                    {steps[currentStep - 1].description}
                  </p>
                </div>
               
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                  {error}
                </div>
              )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Phone Number & OTP */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    Phone Number & OTP *
                    <HelpCircle size={14} style={{ color: '#221461' }} />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition text-gray-900 bg-white"
                    style={{ '--tw-ring-color': '#221461' } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#221461'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = ''
                      e.currentTarget.style.boxShadow = ''
                    }}
                    />
                    <input
                      type="text"
                      value={formData.otp}
                      onChange={(e) => handleInputChange('otp', e.target.value)}
                      placeholder="Enter OTP"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition text-gray-900 bg-white"
                    style={{ '--tw-ring-color': '#221461' } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#221461'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = ''
                      e.currentTarget.style.boxShadow = ''
                    }}
                    />
                  </div>
                  <div className="flex gap-3 mt-3">
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={sendingOtp || otpCountdown > 0}
                      className="px-6 py-2.5 text-white rounded-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      style={{ backgroundColor: '#221461' }}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.backgroundColor = '#1a1049'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.backgroundColor = '#221461'
                        }
                      }}
                    >
                      {sendingOtp ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Sending...
                        </>
                      ) : otpCountdown > 0 ? (
                        `Resend OTP (${otpCountdown}s)`
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={verifyingOtp || !otpSent || !formData.otp}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {verifyingOtp ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Verifying...
                        </>
                      ) : otpVerified ? (
                        <>
                          <CheckCircle size={16} className="text-green-600" />
                          Verified
                        </>
                      ) : (
                        'Verify'
                      )}
                    </button>
                  </div>
                  {/* Informational Box */}
                  <div className="mt-4 border rounded-lg p-3 flex items-start gap-3" style={{ backgroundColor: 'rgba(34, 20, 97, 0.1)', borderColor: 'rgba(34, 20, 97, 0.2)' }}>
                    <FileText size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#221461' }} />
                    <p className="text-xs" style={{ color: '#221461' }}>
                      OTP will be sent to your phone number for verification. Please check your SMS messages.
                    </p>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    Username *
                    <HelpCircle size={14} style={{ color: '#221461' }} />
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter username"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition text-gray-900 bg-white"
                    style={{ '--tw-ring-color': '#221461' } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#221461'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = ''
                      e.currentTarget.style.boxShadow = ''
                    }}
                  />
                </div>

                {/* Profile Photo */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    Profile Photo *
                    <HelpCircle size={14} style={{ color: '#221461' }} />
                  </label>
                  <div className="space-y-3">
                    {!videoReady && !faceCaptured && (
                      <button
                        onClick={startCamera}
                        type="button"
                        className="w-full px-6 py-4 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#221461' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1049'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#221461'}
                      >
                        <Camera size={20} />
                        Start Camera
                      </button>
                    )}
                    
                    {(videoReady || stream) && !faceCaptured && (
                      <div className="space-y-3">
                        <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
                          <video
                            ref={(el) => {
                              if (el) {
                                setVideoRef(el)
                              }
                            }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                            style={{ display: stream ? 'block' : 'none' }}
                          />
                          {!stream && (
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                              <div className="text-center">
                                <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                                <p>Starting camera...</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleCaptureFace}
                            disabled={capturingFace || !employeeId}
                            type="button"
                            className="flex-1 px-6 py-3 text-white rounded-lg transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#221461' }}
                            onMouseEnter={(e) => {
                              if (!e.currentTarget.disabled) {
                                e.currentTarget.style.backgroundColor = '#1a1049'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!e.currentTarget.disabled) {
                                e.currentTarget.style.backgroundColor = '#221461'
                              }
                            }}
                          >
                            {capturingFace ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Capturing...
                              </>
                            ) : (
                              <>
                                <Camera size={20} />
                                Capture Face
                              </>
                            )}
                          </button>
                          <button
                            onClick={stopCamera}
                            type="button"
                            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                          >
                            Stop Camera
                          </button>
                        </div>
                      </div>
                    )}

                    {faceCaptured && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Face captured successfully!</p>
                          <p className="text-xs text-green-700">Your face has been registered for attendance verification.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Informational Box */}
                  <div className="mt-4 border rounded-lg p-3 flex items-start gap-3" style={{ backgroundColor: 'rgba(34, 20, 97, 0.1)', borderColor: 'rgba(34, 20, 97, 0.2)' }}>
                    <FileText size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#221461' }} />
                    <p className="text-xs" style={{ color: '#221461' }}>
                      Your face photo will be used for face recognition during attendance check-in. Please ensure good lighting and a clear face view. This photo will be stored and used to verify your identity when checking in/out.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {/* Gender */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      Gender *
                      <HelpCircle size={14} style={{ color: '#221461' }} />
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236B7279' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '12px 8px'
                      }}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      Date of Birth *
                      <HelpCircle size={14} style={{ color: '#221461' }} />
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none transition text-gray-900 bg-white"
                      style={{ '--tw-ring-color': '#221461' } as React.CSSProperties}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#221461'
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = ''
                        e.currentTarget.style.boxShadow = ''
                      }}
                      />
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      Marital Status *
                      <HelpCircle size={14} style={{ color: '#221461' }} />
                    </label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                      className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236B7279' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '12px 8px'
                      }}
                    >
                      <option value="">Select Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                </div>
                
                {/* Informational Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                  <FileText size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800">
                    This information helps us create a complete profile for your employee record. All data is kept confidential and secure.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Policy Agreement</h3>
                  
                  <div className="space-y-4 text-sm text-gray-700">
                    <div>
                      <h4 className="font-semibold mb-2">Attendance Policy</h4>
                      <p className="text-gray-600">Employees are required to check in and check out daily. Late arrivals and early departures must be approved by your supervisor.</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Leave Policy</h4>
                      <p className="text-gray-600">Leave requests must be submitted in advance through the system. Approval is subject to supervisor discretion and team availability.</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Data Privacy</h4>
                      <p className="text-gray-600">Your personal information will be kept confidential and used only for administrative and HR purposes in accordance with company policies.</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Code of Conduct</h4>
                      <p className="text-gray-600">All employees must adhere to the company's code of conduct, maintaining professionalism and respect in all workplace interactions.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="policyAgreed"
                    checked={formData.policyAgreed}
                    onChange={(e) => handleInputChange('policyAgreed', e.target.checked)}
                    className="mt-1 w-5 h-5 border-gray-300 rounded"
                    style={{ accentColor: '#221461' }}
                    onFocus={(e) => {
                      e.currentTarget.style.outlineColor = '#221461'
                    }}
                  />
                  <label htmlFor="policyAgreed" className="text-sm text-gray-700">
                    I have read and agree to the company policies and terms of service. *
                  </label>
                </div>
              </div>
            )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-12 pt-6 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className={`text-sm font-medium transition ${
                    currentStep === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  PREVIOUS STEP
                </button>

                {currentStep < 3 ? (
                  <button
                    onClick={handleNext}
                    className="px-8 py-3 text-white rounded-lg transition font-medium flex items-center gap-2 text-sm"
                    style={{ backgroundColor: '#221461' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1049'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#221461'}
                  >
                    NEXT
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleCompleteOnboarding}
                    disabled={isLoading || !formData.policyAgreed}
                    className={`px-8 py-3 rounded-lg font-medium transition text-sm ${
                      isLoading || !formData.policyAgreed
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'text-white'
                    }`}
                    style={!isLoading && formData.policyAgreed ? { backgroundColor: '#221461' } : {}}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = '#1a1049'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = '#221461'
                      }
                    }}
                  >
                    {isLoading ? 'Completing...' : 'Complete Onboarding'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
