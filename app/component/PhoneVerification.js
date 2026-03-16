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

  return (
    <div className={`bg-white border rounded-2xl p-6 lg:p-7 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-500 relative overflow-hidden group ${isVerified ? 'border-zinc-200/80' : 'border-amber-100 bg-amber-50/5'}`}>
      <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-50/20 rounded-full blur-3xl -ml-12 -mt-12" />
      
      <div className="flex items-center justify-between mb-5 relative">
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-zinc-800 tracking-tight">Security Center</h3>
            <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide mt-0.5">Mobile Access Verification</p>
          </div>
        </div>
        {isVerified && (
          <span className="text-[10px] font-semibold uppercase tracking-wide bg-emerald-500 text-white px-2.5 py-1 rounded-lg shadow-md shadow-emerald-500/15">
             Verified
          </span>
        )}
      </div>

      {isVerified && step !== "otp-sent" ? (
        <div className="relative">
          <div className="bg-white border border-zinc-100 rounded-xl p-3.5 flex items-center justify-between">
             <div>
                <p className="text-[13px] font-semibold text-zinc-800">{existingPhone || phone}</p>
                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide mt-0.5">Primary Notification Alias</p>
             </div>
             <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
             </div>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium mt-3">Cloud-sync active. You'll receive real-time session push alerts.</p>
        </div>
      ) : (
        <div className="relative space-y-5">
           {/* Step 1: Enter phone */}
          {(step === "idle" || step === "sending") && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="flex-1 bg-white border border-zinc-200 text-zinc-800 text-[13px] rounded-xl px-4 py-2.5 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                />
                <button
                  onClick={handleSendOtp}
                  disabled={step === "sending"}
                  className={`px-5 rounded-xl text-[11px] font-semibold uppercase tracking-wide transition-all transform active:scale-95 ${
                    step === "sending"
                      ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      : "bg-zinc-800 text-white hover:bg-indigo-600 shadow-lg shadow-zinc-900/8"
                  }`}
                >
                  {step === "sending" ? "..." : "Send OTP"}
                </button>
              </div>
              <p className="text-[11px] text-amber-600/70 font-medium">Mobile verification is required for collaborative study sessions.</p>
            </div>
          )}

          {/* Step 2: Enter OTP */}
          {(step === "otp-sent" || step === "verifying" || step === "verified") && (
            <div className="space-y-5">
              {step !== "verified" && (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Awaiting Identity Pin</p>
                    <button onClick={() => { setStep("idle"); setOtp(""); setDemoOtp(""); }} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition">
                        Change Number
                    </button>
                  </div>
                  
                  {demoOtp && (
                    <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl text-center group">
                      <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide mb-1.5 group-hover:text-indigo-600 transition-colors">Development Token</p>
                      <p className="text-xl font-bold text-indigo-600 tracking-[0.4em] font-mono">{demoOtp}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="flex-1 bg-white border border-zinc-200 text-zinc-800 text-lg font-bold rounded-xl px-4 py-2.5 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-mono text-center tracking-[0.4em]"
                    />
                    <button
                      onClick={handleVerifyOtp}
                      disabled={step === "verifying"}
                      className={`px-6 rounded-xl text-[11px] font-semibold uppercase tracking-wide transition-all transform active:scale-95 ${
                        step === "verifying"
                          ? "bg-zinc-100 text-zinc-400"
                          : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/15"
                      }`}
                    >
                      {step === "verifying" ? "..." : "Verify"}
                    </button>
                  </div>
                </>
              )}
              {step === "verified" && (
                <div className="text-center py-3.5 bg-emerald-50 rounded-xl border border-emerald-100 animate-in zoom-in duration-500">
                   <p className="text-emerald-600 font-semibold text-[13px] uppercase tracking-wide">✅ Security Breach Averted</p>
                   <p className="text-[11px] text-emerald-500/80 font-medium mt-0.5">Identity verified. Access granted.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 bg-rose-50 border border-rose-100 px-3.5 py-2 rounded-lg">
           <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
           <p className="text-rose-600 text-[11px] font-semibold tracking-tight">{error}</p>
        </div>
      )}
    </div>
  )
}
