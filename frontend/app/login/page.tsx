'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Clock, Users, CheckCircle, Shield, Loader2, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import TermsModal from '../components/TermsModal'
import Toast from '../components/Toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function LoginPage() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<'email' | 'mobile'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [rememberMe, setRememberMe] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [signUpMethod, setSignUpMethod] = useState<'email' | 'mobile'>('email')
  const [signUpMobileNumber, setSignUpMobileNumber] = useState('')
  const [signUpOtp, setSignUpOtp] = useState('')
  const [signUpOtpSent, setSignUpOtpSent] = useState(false)
  const [signUpOtpVerified, setSignUpOtpVerified] = useState(false)
  const [signUpSendingOtp, setSignUpSendingOtp] = useState(false)
  const [signUpVerifyingOtp, setSignUpVerifyingOtp] = useState(false)
  const [signUpOtpCountdown, setSignUpOtpCountdown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  })

  const handleSendLoginOTP = async () => {
    if (!mobileNumber) {
      setError('Please enter a mobile number')
      return
    }

    const phoneRegex = /^[0-9]{10}$/
    const cleanPhone = mobileNumber.replace(/\D/g, '')
    
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number')
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
        setOtpVerified(false)
        setOtpCountdown(60)
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

  const handleVerifyLoginOTP = async () => {
    if (!otp) {
      setError('Please enter OTP')
      return
    }

    if (!mobileNumber) {
      setError('Please enter mobile number first')
      return
    }

    const otpRegex = /^[0-9]{4}$/
    if (!otpRegex.test(otp)) {
      setError('OTP must be 4 digits')
      return
    }

    setError('')
    setVerifyingOtp(true)
    try {
      const cleanPhone = mobileNumber.replace(/\D/g, '')
      const response = await axios.post(`${API_URL}/api/otp/verify`, {
        mobileNumber: cleanPhone,
        otp: otp
      })

      if (response.data.success) {
        setOtpVerified(true)
        setOtpCountdown(0)
        setError('')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid OTP. Please try again.')
      setOtpVerified(false)
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      let response
      if (loginMethod === 'mobile') {
        if (!otpVerified) {
          setError('Please verify OTP first')
          setIsLoading(false)
          return
        }
        const cleanPhone = mobileNumber.replace(/\D/g, '')
        response = await axios.post(`${API_URL}/api/auth/login`, {
          mobileNumber: cleanPhone
        })
      } else {
        response = await axios.post(`${API_URL}/api/auth/login`, {
          email,
          password
        })
      }

      if (response.data.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // Check onboarding status
        try {
          const onboardingResponse = await axios.get(`${API_URL}/api/onboarding/status`, {
            headers: { Authorization: `Bearer ${response.data.token}` }
          })
          
          if (!onboardingResponse.data.completed) {
            // Redirect to onboarding if not completed
            router.push('/onboarding')
          } else {
            // Redirect to main app if onboarding completed
            router.push('/')
          }
        } catch (onboardingError) {
          // If onboarding check fails, assume not completed and redirect to onboarding
          router.push('/onboarding')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Password validation
  const passwordValidations = {
    minLength: signUpPassword.length >= 8,
    hasLowercase: /[a-z]/.test(signUpPassword),
    hasUppercase: /[A-Z]/.test(signUpPassword),
    hasNumber: /[0-9]/.test(signUpPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(signUpPassword),
    passwordsMatch: signUpPassword === confirmPassword && confirmPassword.length > 0
  }

  const isPasswordValid = Object.values(passwordValidations).every(v => v === true)

  const handleSendSignUpOTP = async () => {
    if (!signUpMobileNumber) {
      setError('Please enter a mobile number')
      return
    }

    const phoneRegex = /^[0-9]{10}$/
    const cleanPhone = signUpMobileNumber.replace(/\D/g, '')
    
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setError('')
    setSignUpSendingOtp(true)
    try {
      const response = await axios.post(`${API_URL}/api/otp/send`, {
        mobileNumber: cleanPhone
      })

      if (response.data.success) {
        setSignUpOtpSent(true)
        setSignUpOtpVerified(false)
        setSignUpOtpCountdown(60)
        const timer = setInterval(() => {
          setSignUpOtpCountdown((prev) => {
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
      setSignUpSendingOtp(false)
    }
  }

  const handleVerifySignUpOTP = async () => {
    if (!signUpOtp) {
      setError('Please enter OTP')
      return
    }

    if (!signUpMobileNumber) {
      setError('Please enter mobile number first')
      return
    }

    if (!name) {
      setError('Please enter your name first')
      return
    }

    const otpRegex = /^[0-9]{4}$/
    if (!otpRegex.test(signUpOtp)) {
      setError('OTP must be 4 digits')
      return
    }

    setError('')
    setSignUpVerifyingOtp(true)
    try {
      const cleanPhone = signUpMobileNumber.replace(/\D/g, '')
      const response = await axios.post(`${API_URL}/api/otp/verify`, {
        mobileNumber: cleanPhone,
        otp: signUpOtp
      })

      if (response.data.success) {
        setSignUpOtpVerified(true)
        setSignUpOtpCountdown(0)
        setError('')
        
        // Automatically proceed with signup after OTP verification
        // Check if terms are accepted first
        if (!termsAccepted) {
          setShowTermsModal(true)
          setSignUpVerifyingOtp(false)
          return
        }
        
        // Proceed with signup
        await proceedWithMobileSignup(cleanPhone)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid OTP. Please try again.')
      setSignUpOtpVerified(false)
    } finally {
      setSignUpVerifyingOtp(false)
    }
  }

  const proceedWithMobileSignup = async (cleanPhone: string) => {
    setSignUpLoading(true)
    setError('')

    try {
      const signupData = { 
        name,
        mobileNumber: cleanPhone
      }

      const response = await axios.post(`${API_URL}/api/auth/signup`, signupData)

      if (response.data.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // Clear form fields
        setName('')
        setSignUpEmail('')
        setSignUpPassword('')
        setConfirmPassword('')
        setSignUpMobileNumber('')
        setSignUpOtp('')
        setSignUpOtpSent(false)
        setSignUpOtpVerified(false)
        setTermsAccepted(false)
        
        // Show success toast
        setToast({
          message: 'Account created successfully! Redirecting...',
          type: 'success',
          isVisible: true
        })
        
        // Redirect to onboarding after a short delay
        setTimeout(() => {
          router.push('/onboarding')
        }, 1500)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Sign up failed. Please try again.')
    } finally {
      setSignUpLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!termsAccepted) {
      setShowTermsModal(true)
      return
    }

    // Check if using mobile number signup
    const usingMobile = signUpMethod === 'mobile'
    
    if (usingMobile) {
      if (!signUpOtpVerified) {
        setError('Please verify your mobile number with OTP first')
        return
      }
    } else {
      // Email signup validation
      if (signUpPassword !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      if (!isPasswordValid) {
        setError('Please meet all password requirements')
        return
      }
    }

    setSignUpLoading(true)
    setError('')

    try {
      const cleanPhone = signUpMobileNumber.replace(/\D/g, '')
      const signupData: any = { name }
      
      if (usingMobile) {
        signupData.mobileNumber = cleanPhone
      } else {
        signupData.email = signUpEmail
        signupData.password = signUpPassword
      }

      const response = await axios.post(`${API_URL}/api/auth/signup`, signupData)

      if (response.data.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // Clear form fields
        setName('')
        setSignUpEmail('')
        setSignUpPassword('')
        setConfirmPassword('')
        setSignUpMobileNumber('')
        setSignUpOtp('')
        setSignUpOtpSent(false)
        setSignUpOtpVerified(false)
        setTermsAccepted(false)
        
        // Show success toast
        setToast({
          message: 'Account created successfully! Redirecting...',
          type: 'success',
          isVisible: true
        })
        
        // Redirect to onboarding after a short delay
        setTimeout(() => {
          router.push('/onboarding')
        }, 1500)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Sign up failed. Please try again.')
    } finally {
      setSignUpLoading(false)
    }
  }

  const handleAcceptTerms = () => {
    setTermsAccepted(true)
    setShowTermsModal(false)
    
    // If OTP is already verified and we're using mobile signup, proceed with signup
    if (signUpMethod === 'mobile' && signUpOtpVerified && signUpMobileNumber) {
      const cleanPhone = signUpMobileNumber.replace(/\D/g, '')
      proceedWithMobileSignup(cleanPhone)
    }
  }

  const handleTermsLinkClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowTermsModal(true)
  }

  const handleSignUpClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsSignUp(true)
    // Reset password visibility when switching to signup
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleBackToLogin = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsSignUp(false)
    // Reset password visibility when switching back to login
    setShowLoginPassword(false)
  }

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex overflow-hidden relative">
      {/* Left Column - Login/SignUp Form */}
      <div className={`w-full lg:w-1/2 bg-white flex items-center justify-center p-8 transition-smooth transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform ${
        isSignUp ? 'translate-x-full lg:translate-x-full' : 'translate-x-0'
      }`} style={{ transform: isSignUp ? 'translate3d(100%, 0, 0)' : 'translate3d(0, 0, 0)' }}>
        <div className="w-full max-w-md">
          {!isSignUp ? (
            <>
              {/* Logo */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transform rotate-12" style={{ backgroundColor: '#221461' }}>
                    <Clock className="text-white" size={24} />
                  </div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transform -rotate-12 -ml-3" style={{ backgroundColor: '#1a1049' }}>
                    <Users className="text-white" size={24} />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mt-4">Welcome Back!</h1>
                <p className="text-gray-600 mt-2">Please enter your details to access your attendance dashboard</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
                {/* Login Method Toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('email')
                      setError('')
                      setOtpSent(false)
                      setOtpVerified(false)
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                      loginMethod === 'email'
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={loginMethod === 'email' ? { backgroundColor: '#221461' } : {}}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('mobile')
                      setError('')
                      setOtpSent(false)
                      setOtpVerified(false)
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                      loginMethod === 'mobile'
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={loginMethod === 'mobile' ? { backgroundColor: '#221461' } : {}}
                  >
                    Mobile
                  </button>
                </div>

                {loginMethod === 'email' ? (
                  <>
                    {/* Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition text-gray-900 bg-white placeholder:text-gray-400"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#221461'
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = ''
                          e.currentTarget.style.boxShadow = ''
                        }}
                        placeholder="Enter your email"
                        autoComplete="off"
                        required
                      />
                    </div>

                    {/* Password Field */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type={showLoginPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg outline-none transition text-gray-900 bg-white placeholder:text-gray-400 placeholder:opacity-100"
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#221461'
                            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = ''
                            e.currentTarget.style.boxShadow = ''
                          }}
                          placeholder="Enter your password"
                          autoComplete="off"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Mobile Number Field */}
                    <div>
                      <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <input
                        id="mobileNumber"
                        name="mobileNumber"
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition text-gray-900 bg-white placeholder:text-gray-400"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#221461'
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = ''
                          e.currentTarget.style.boxShadow = ''
                        }}
                        placeholder="Enter 10-digit mobile number"
                        autoComplete="off"
                        maxLength={10}
                        required
                      />
                    </div>

                    {/* OTP Field */}
                    {otpSent && (
                      <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                          OTP
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="otp"
                            name="otp"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg outline-none transition text-gray-900 bg-white placeholder:text-gray-400"
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#221461'
                              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = ''
                              e.currentTarget.style.boxShadow = ''
                            }}
                            placeholder="Enter 4-digit OTP"
                            autoComplete="off"
                            maxLength={4}
                            required
                          />
                          <button
                            type="button"
                            onClick={handleVerifyLoginOTP}
                            disabled={verifyingOtp || !otp}
                            className="px-4 py-3 text-white rounded-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            style={{ backgroundColor: '#221461' }}
                          >
                            {verifyingOtp ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Verifying...
                              </>
                            ) : otpVerified ? (
                              <>
                                <CheckCircle size={16} />
                                Verified
                              </>
                            ) : (
                              'Verify'
                            )}
                          </button>
                        </div>
                        {otpVerified && (
                          <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                            <CheckCircle size={16} />
                            OTP verified successfully
                          </div>
                        )}
                      </div>
                    )}

                    {/* Send OTP Button */}
                    {!otpSent && (
                      <button
                        type="button"
                        onClick={handleSendLoginOTP}
                        disabled={sendingOtp || !mobileNumber}
                        className="w-full px-4 py-3 text-white rounded-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#221461' }}
                      >
                        {sendingOtp ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Sending OTP...
                          </>
                        ) : (
                          'Send OTP'
                        )}
                      </button>
                    )}

                    {/* Resend OTP */}
                    {otpSent && otpCountdown > 0 && (
                      <div className="text-sm text-gray-600 text-center">
                        Resend OTP in {otpCountdown}s
                      </div>
                    )}
                    {otpSent && otpCountdown === 0 && !otpVerified && (
                      <button
                        type="button"
                        onClick={handleSendLoginOTP}
                        className="w-full px-4 py-2 text-sm font-medium hover:underline"
                        style={{ color: '#221461' }}
                      >
                        Resend OTP
                      </button>
                    )}
                  </>
                )}

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 border-gray-300 rounded"
                      style={{ accentColor: '#221461' }}
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-sm font-medium" style={{ color: '#221461' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1a1049'} onMouseLeave={(e) => e.currentTarget.style.color = '#221461'}>
                    Forgot Password?
                  </a>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white py-3 px-6 rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#221461', boxShadow: '0 10px 15px -3px rgba(34, 20, 97, 0.3)' }}
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
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>

                {/* Terms & Privacy */}
                <p className="text-xs text-gray-500 text-center">
                  By logging in, you agree to our{' '}
                  <a href="#" style={{ color: '#221461' }} className="hover:underline" onMouseEnter={(e) => e.currentTarget.style.color = '#1a1049'} onMouseLeave={(e) => e.currentTarget.style.color = '#221461'}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" style={{ color: '#221461' }} className="hover:underline" onMouseEnter={(e) => e.currentTarget.style.color = '#1a1049'} onMouseLeave={(e) => e.currentTarget.style.color = '#221461'}>Privacy Policy</a>
                </p>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <a href="#" onClick={handleSignUpClick} className="font-semibold hover:underline" style={{ color: '#221461' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1a1049'} onMouseLeave={(e) => e.currentTarget.style.color = '#221461'}>
                    Sign Up
                  </a>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Sign Up Logo */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transform rotate-12" style={{ backgroundColor: '#221461' }}>
                    <Clock className="text-white" size={24} />
                  </div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transform -rotate-12 -ml-3" style={{ backgroundColor: '#1a1049' }}>
                    <Users className="text-white" size={24} />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mt-4">Create Account</h1>
                <p className="text-gray-600 mt-2">Sign up to get started with your attendance dashboard</p>
              </div>

              {/* Sign Up Form */}
              <form onSubmit={handleSignUp} className="space-y-6" autoComplete="off">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition text-gray-900 bg-white"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#221461'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = ''
                      e.currentTarget.style.boxShadow = ''
                    }}
                    placeholder="Enter your full name"
                    autoComplete="off"
                    required
                  />
                </div>

                {/* Signup Method Toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setSignUpMethod('email')
                      setSignUpMobileNumber('')
                      setSignUpOtp('')
                      setSignUpOtpSent(false)
                      setSignUpOtpVerified(false)
                      setError('')
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                      signUpMethod === 'email'
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={signUpMethod === 'email' ? { backgroundColor: '#221461' } : {}}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignUpMethod('mobile')
                      setSignUpEmail('')
                      setSignUpPassword('')
                      setConfirmPassword('')
                      setError('')
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                      signUpMethod === 'mobile'
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={signUpMethod === 'mobile' ? { backgroundColor: '#221461' } : {}}
                  >
                    Mobile
                  </button>
                </div>

                {/* Email Signup Fields */}
                {signUpMethod === 'email' && (
                  <>
                    {/* Email Field */}
                    <div>
                      <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        id="signup-email"
                        name="email"
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition text-gray-900 bg-white"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#221461'
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = ''
                          e.currentTarget.style.boxShadow = ''
                        }}
                        placeholder="Enter your email"
                        autoComplete="off"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Mobile Signup Fields */}
                {signUpMethod === 'mobile' && (
                  <>
                    {/* Mobile Number Field */}
                    <div>
                      <label htmlFor="signup-mobile" className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <input
                        id="signup-mobile"
                        name="mobileNumber"
                        type="tel"
                        value={signUpMobileNumber}
                        onChange={(e) => setSignUpMobileNumber(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition text-gray-900 bg-white"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#221461'
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = ''
                          e.currentTarget.style.boxShadow = ''
                        }}
                        placeholder="Enter 10-digit mobile number"
                        autoComplete="off"
                        maxLength={10}
                        required
                      />
                    </div>

                    {/* OTP Field */}
                    {signUpOtpSent && (
                      <div>
                        <label htmlFor="signup-otp" className="block text-sm font-medium text-gray-700 mb-2">
                          OTP
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="signup-otp"
                            name="otp"
                            type="text"
                            value={signUpOtp}
                            onChange={(e) => setSignUpOtp(e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg outline-none transition text-gray-900 bg-white"
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#221461'
                              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = ''
                              e.currentTarget.style.boxShadow = ''
                            }}
                            placeholder="Enter 4-digit OTP"
                            autoComplete="off"
                            maxLength={4}
                            required
                          />
                          <button
                            type="button"
                            onClick={handleVerifySignUpOTP}
                            disabled={signUpVerifyingOtp || !signUpOtp}
                            className="px-4 py-3 text-white rounded-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            style={{ backgroundColor: '#221461' }}
                          >
                            {signUpVerifyingOtp ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Verifying...
                              </>
                            ) : signUpOtpVerified ? (
                              <>
                                <CheckCircle size={16} />
                                Verified
                              </>
                            ) : (
                              'Verify'
                            )}
                          </button>
                        </div>
                        {signUpOtpVerified && (
                          <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                            <CheckCircle size={16} />
                            Mobile number verified successfully
                          </div>
                        )}
                      </div>
                    )}

                    {/* Send OTP Button */}
                    {!signUpOtpSent && (
                      <button
                        type="button"
                        onClick={handleSendSignUpOTP}
                        disabled={signUpSendingOtp || !signUpMobileNumber}
                        className="w-full px-4 py-3 text-white rounded-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#221461' }}
                      >
                        {signUpSendingOtp ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Sending OTP...
                          </>
                        ) : (
                          'Send OTP'
                        )}
                      </button>
                    )}

                    {/* Resend OTP */}
                    {signUpOtpSent && signUpOtpCountdown > 0 && (
                      <div className="text-sm text-gray-600 text-center">
                        Resend OTP in {signUpOtpCountdown}s
                      </div>
                    )}
                    {signUpOtpSent && signUpOtpCountdown === 0 && !signUpOtpVerified && (
                      <button
                        type="button"
                        onClick={handleSendSignUpOTP}
                        className="w-full px-4 py-2 text-sm font-medium hover:underline"
                        style={{ color: '#221461' }}
                      >
                        Resend OTP
                      </button>
                    )}
                  </>
                )}

                {/* Password Fields - Only show for email signup */}
                {signUpMethod === 'email' && (
                  <>
                    {/* Password Field */}
                    <div>
                      <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="signup-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg outline-none transition text-gray-900 bg-white"
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#221461'
                            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = ''
                            e.currentTarget.style.boxShadow = ''
                          }}
                          placeholder="Create a password"
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      
                      {/* Password Requirements */}
                      {signUpPassword.length > 0 && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                passwordValidations.minLength ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {passwordValidations.minLength && <CheckCircle size={14} className="text-white" />}
                              </div>
                              <span className={`text-sm ${passwordValidations.minLength ? 'text-green-700' : 'text-gray-600'}`}>
                                8 character minimum
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                passwordValidations.hasLowercase ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {passwordValidations.hasLowercase && <CheckCircle size={14} className="text-white" />}
                              </div>
                              <span className={`text-sm ${passwordValidations.hasLowercase ? 'text-green-700' : 'text-gray-600'}`}>
                                One lowercase character
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                passwordValidations.hasUppercase ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {passwordValidations.hasUppercase && <CheckCircle size={14} className="text-white" />}
                              </div>
                              <span className={`text-sm ${passwordValidations.hasUppercase ? 'text-green-700' : 'text-gray-600'}`}>
                                One uppercase character
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                passwordValidations.hasNumber ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {passwordValidations.hasNumber && <CheckCircle size={14} className="text-white" />}
                              </div>
                              <span className={`text-sm ${passwordValidations.hasNumber ? 'text-green-700' : 'text-gray-600'}`}>
                                One number
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                passwordValidations.hasSpecialChar ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {passwordValidations.hasSpecialChar && <CheckCircle size={14} className="text-white" />}
                              </div>
                              <span className={`text-sm ${passwordValidations.hasSpecialChar ? 'text-green-700' : 'text-gray-600'}`}>
                                One special character
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                passwordValidations.passwordsMatch ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {passwordValidations.passwordsMatch && <CheckCircle size={14} className="text-white" />}
                              </div>
                              <span className={`text-sm ${passwordValidations.passwordsMatch ? 'text-green-700' : 'text-gray-600'}`}>
                                Passwords match
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirm-password"
                          name="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full px-4 py-3 pr-10 border rounded-lg outline-none transition text-gray-900 bg-white ${
                            confirmPassword.length > 0 && signUpPassword !== confirmPassword
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                          onFocus={(e) => {
                            if (confirmPassword.length === 0 || signUpPassword === confirmPassword) {
                              e.currentTarget.style.borderColor = '#221461'
                              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 20, 97, 0.2)'
                            }
                          }}
                          onBlur={(e) => {
                            if (confirmPassword.length === 0 || signUpPassword === confirmPassword) {
                              e.currentTarget.style.borderColor = ''
                              e.currentTarget.style.boxShadow = ''
                            }
                          }}
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && signUpPassword !== confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                      )}
                    </div>
                  </>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Sign Up Button */}
                <button
                  type="submit"
                  disabled={
                    signUpLoading || 
                    !termsAccepted || 
                    (signUpMethod === 'email' && (!isPasswordValid || signUpPassword !== confirmPassword)) ||
                    (signUpMethod === 'mobile' && !signUpOtpVerified)
                  }
                  className="w-full text-white py-3 px-6 rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#221461', boxShadow: '0 10px 15px -3px rgba(34, 20, 97, 0.3)' }}
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
                  {signUpLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Sign Up
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>

                {/* Terms & Privacy */}
                <p className="text-xs text-gray-500 text-center">
                  By signing up, you agree to our{' '}
                  <a href="#" onClick={handleTermsLinkClick} className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#" onClick={handleTermsLinkClick} className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </form>

              {/* Back to Login Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <a href="#" onClick={handleBackToLogin} className="font-semibold hover:underline" style={{ color: '#221461' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1a1049'} onMouseLeave={(e) => e.currentTarget.style.color = '#221461'}>
                    Login
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Column - Promotional with Carousel */}
      <div className={`hidden lg:flex lg:w-1/2 relative overflow-hidden transition-smooth transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform ${
        isSignUp ? '-translate-x-full' : 'translate-x-0'
      }`} style={{ transform: isSignUp ? 'translate3d(-100%, 0, 0)' : 'translate3d(0, 0, 0)' }}>
        {/* Frosted Glass Overlay */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Carousel Container - Centered */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <div className="w-full max-w-2xl px-12">
            {/* Slides Container */}
            <div className="relative h-[500px] overflow-hidden mb-8">
              {/* Slide 1 - Main Feature */}
              <div 
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${
                  currentSlide === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                }`}
              >
                <div className="mb-8">
                  <div className="w-72 h-72 bg-white/20 rounded-3xl backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-2xl mx-auto">
                    <div className="text-center">
                      <div className="w-36 h-36 bg-white/30 rounded-2xl mx-auto mb-6 flex items-center justify-center backdrop-blur-sm">
                        <Clock className="text-white" size={72} />
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Users className="text-white/80" size={28} />
                        <CheckCircle className="text-white/80" size={28} />
                        <Shield className="text-white/80" size={28} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center max-w-lg">
                  <h2 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">Seamless Attendance Management</h2>
                  <p className="text-lg text-white/90 drop-shadow-md">
                    Everything you need for efficient employee attendance tracking in an easily customizable dashboard
                  </p>
                </div>
              </div>

              {/* Slide 2 - Face Recognition */}
              <div 
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${
                  currentSlide === 1 ? 'opacity-100 translate-x-0' : currentSlide < 1 ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full'
                }`}
              >
                <div className="mb-8">
                  <div className="w-72 h-72 bg-white/20 rounded-3xl backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-2xl mx-auto">
                    <div className="text-center">
                      <div className="w-36 h-36 bg-white/30 rounded-2xl mx-auto mb-6 flex items-center justify-center backdrop-blur-sm">
                        <Users className="text-white" size={72} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center max-w-lg">
                  <h2 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">AI-Powered Face Recognition</h2>
                  <p className="text-lg text-white/90 drop-shadow-md">
                    Advanced facial recognition technology ensures accurate and secure employee identification with 99% accuracy
                  </p>
                </div>
              </div>

              {/* Slide 3 - Real-time Tracking */}
              <div 
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${
                  currentSlide === 2 ? 'opacity-100 translate-x-0' : currentSlide < 2 ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full'
                }`}
              >
                <div className="mb-8">
                  <div className="w-72 h-72 bg-white/20 rounded-3xl backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-2xl mx-auto">
                    <div className="text-center">
                      <div className="w-36 h-36 bg-white/30 rounded-2xl mx-auto mb-6 flex items-center justify-center backdrop-blur-sm">
                        <Clock className="text-white" size={72} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center max-w-lg">
                  <h2 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">Real-time Attendance Tracking</h2>
                  <p className="text-lg text-white/90 drop-shadow-md">
                    Monitor employee attendance in real-time with instant check-in/check-out notifications and detailed analytics
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Cards - Always Visible */}
            <div className="grid grid-cols-3 gap-6 w-full max-w-2xl mx-auto mb-8">
              <div className="text-center backdrop-blur-sm bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition cursor-pointer">
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                  <Users className="text-white" size={28} />
                </div>
                <p className="text-sm text-white/90 font-semibold">Face Recognition</p>
              </div>
              <div className="text-center backdrop-blur-sm bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition cursor-pointer">
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                  <Clock className="text-white" size={28} />
                </div>
                <p className="text-sm text-white/90 font-semibold">Real-time Tracking</p>
              </div>
              <div className="text-center backdrop-blur-sm bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition cursor-pointer">
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                  <Shield className="text-white" size={28} />
                </div>
                <p className="text-sm text-white/90 font-semibold">Secure & Accurate</p>
              </div>
            </div>

            {/* Navigation Dots - Clickable */}
            <div className="flex gap-3 justify-center items-center">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`transition-all duration-300 ${
                    currentSlide === index
                      ? 'w-10 h-2 bg-white rounded-full'
                      : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Privacy Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleAcceptTerms}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  )
}
