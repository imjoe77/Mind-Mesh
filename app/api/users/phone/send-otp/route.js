import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

// POST /api/users/phone/send-otp — generate & store OTP (demo: returns it to client)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { phone } = await req.json();
    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 });
    }

    await connectDB();

    // Generate a 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await User.findByIdAndUpdate(session.user.id, {
      $set: {
        phone,
        phoneOtp: otp,
        phoneOtpExpiry: expiresAt,
        phoneVerified: false,
      },
    });

    // In production, you would send the OTP via SMS (e.g. Twilio).
    // For the hackathon demo, we log it and return it to the client.
    console.log(`[OTP] Sent OTP ${otp} to ${phone} for user ${session.user.id}`);

    return NextResponse.json({ 
      success: true, 
      message: "OTP sent! Check your phone.",
      // DEMO ONLY — remove in production!
      demoOtp: otp,
    });
  } catch (err) {
    console.error("[SEND_OTP]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
