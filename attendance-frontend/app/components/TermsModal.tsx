'use client'

import { X } from 'lucide-react'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
}

export default function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Terms of Service & Privacy Policy</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Terms of Service */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Terms of Service</h3>
            <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
              <p>
                By accessing and using this Attendance Management System, you agree to be bound by the following terms and conditions:
              </p>
              <p>
                <strong>1. Account Responsibility:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
              <p>
                <strong>2. Acceptable Use:</strong> You agree to use the system only for lawful purposes and in accordance with these Terms. You agree not to use the system in any way that could damage, disable, or impair the service.
              </p>
              <p>
                <strong>3. Data Accuracy:</strong> You are responsible for ensuring that all information you provide is accurate, current, and complete.
              </p>
              <p>
                <strong>4. Service Availability:</strong> We reserve the right to modify, suspend, or discontinue the service at any time without prior notice.
              </p>
            </div>
          </section>

          {/* Privacy Policy */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy Policy</h3>
            <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
              <p>
                We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information:
              </p>
              <p>
                <strong>1. Information Collection:</strong> We collect information that you provide directly to us, including your name, email address, and attendance data. We also collect face recognition data for authentication purposes.
              </p>
              <p>
                <strong>2. Data Usage:</strong> Your information is used to provide and improve our services, authenticate your identity, and manage attendance records. We do not sell your personal information to third parties.
              </p>
              <p>
                <strong>3. Data Security:</strong> We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <p>
                <strong>4. Data Retention:</strong> We retain your personal information for as long as necessary to provide our services and comply with legal obligations.
              </p>
              <p>
                <strong>5. Your Rights:</strong> You have the right to access, update, or delete your personal information at any time by contacting us.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Questions?</strong> If you have any questions about these Terms or our Privacy Policy, please contact us at{' '}
              <a href="mailto:support@attendance.com" className="hover:underline" style={{ color: '#221461' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1a1049'} onMouseLeave={(e) => e.currentTarget.style.color = '#221461'}>
                support@attendance.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-2 text-white rounded-lg transition font-medium"
            style={{ backgroundColor: '#221461' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1049'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#221461'}
          >
            I Accept
          </button>
        </div>
      </div>
    </div>
  )
}
