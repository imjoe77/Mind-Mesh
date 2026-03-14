"use client"

import { useState, useEffect } from "react"

export default function PhoneVerification() {
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState("idle") // idle | sending | otp-sent | verifying | verified
  const [error, setError] = useState("")
  const [demoOtp, setDemoOtp] = useState("")
  const [existingPhone, setExistingPhone] = useState("")
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    fetchPhoneStatus()
  }, [])

  const fetchPhoneStatus = async () => {
    try {
      const res = await fetch("/api/users/profile")
      const data = await res.json()
      if (res.ok && data.user) {
        setExistingPhone(data.user.phone || "")
        setIsVerified(data.user.phoneVerified || false)
        if (data.user.phone) setPhone(data.user.phone)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      setError("Enter a valid phone number")
      return
    }
    setError("")
    setStep("sending")
    try {
      const res = await fetch("/api/users/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      })
      const data = await res.json()
      if (res.ok) {
        setStep("otp-sent")
        // Demo mode: show the OTP
        if (data.demoOtp) setDemoOtp(data.demoOtp)
      } else {
        setError(data.error || "Failed to send OTP")
        setStep("idle")
      }
    } catch (err) {
      setError("Network error")
      setStep("idle")
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError("Enter the 6-digit OTP")
      return
    }
    setError("")
    setStep("verifying")
    try {
      const res = await fetch("/api/users/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp })
      })
      const data = await res.json()
      if (res.ok) {
        setStep("verified")
        setIsVerified(true)
        setDemoOtp("")
      } else {
        setError(data.error || "Verification failed")
        setStep("otp-sent")
      }
    } catch (err) {
      setError("Network error")
      setStep("otp-sent")
    }
  }

  if (isVerified && step !== "otp-sent") {
    return (
      <div className="bg-white border border-zinc-100 rounded-xl p-5 hover:shadow-lg transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Phone Verified</p>
              <p className="text-xs text-zinc-400">{existingPhone || phone}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-600 border border-green-200 px-2.5 py-1 rounded-full font-bold">
            ✓ Verified
          </span>
        </div>
        <p className="text-[10px] text-zinc-400 mt-3">You&apos;ll receive SMS notifications when study sessions go live.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-5 hover:shadow-lg transition">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Mobile Notifications</h3>
          <p className="text-[10px] text-zinc-400">Add & verify your phone for session alerts</p>
        </div>
      </div>

      {/* Step 1: Enter phone */}
      {(step === "idle" || step === "sending") && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="flex-1 bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
            <button
              onClick={handleSendOtp}
              disabled={step === "sending"}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                step === "sending"
                  ? "bg-zinc-100 text-zinc-400"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
              }`}
            >
              {step === "sending" ? "Sending..." : "Send OTP"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Enter OTP */}
      {(step === "otp-sent" || step === "verifying") && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">OTP sent to <span className="font-semibold text-zinc-700">{phone}</span></p>
          
          {demoOtp && (
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Demo Mode — Your OTP</p>
              <p className="text-lg font-mono font-bold text-amber-800 tracking-[0.3em]">{demoOtp}</p>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="flex-1 bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none transition font-mono text-center tracking-[0.3em]"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={step === "verifying"}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                step === "verifying"
                  ? "bg-zinc-100 text-zinc-400"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-md"
              }`}
            >
              {step === "verifying" ? "Checking..." : "Verify"}
            </button>
          </div>
          <button onClick={() => { setStep("idle"); setOtp(""); setDemoOtp(""); }} className="text-xs text-zinc-400 hover:text-zinc-600 transition">
            ← Change number
          </button>
        </div>
      )}

      {/* Step 3: Verified */}
      {step === "verified" && (
        <div className="text-center py-3">
          <p className="text-green-600 font-bold text-sm">✅ Phone verified successfully!</p>
          <p className="text-xs text-zinc-400 mt-1">You&apos;ll now receive session notifications.</p>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>
      )}
    </div>
  )
}
