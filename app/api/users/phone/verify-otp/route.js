import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

// POST /api/users/phone/verify-otp — verify the OTP
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { otp } = await req.json();
    if (!otp) return NextResponse.json({ error: "OTP is required" }, { status: 400 });

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!user.phoneOtp) {
      return NextResponse.json({ error: "No OTP was requested. Send OTP first." }, { status: 400 });
    }

    if (new Date() > new Date(user.phoneOtpExpiry)) {
      return NextResponse.json({ error: "OTP has expired. Request a new one." }, { status: 400 });
    }

    if (user.phoneOtp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // OTP matches — mark phone as verified
    user.phoneVerified = true;
    user.phoneOtp = "";
    user.phoneOtpExpiry = undefined;
    await user.save();

    return NextResponse.json({ 
      success: true, 
      message: "Phone number verified successfully! ✅",
      phone: user.phone,
    });
  } catch (err) {
    console.error("[VERIFY_OTP]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
