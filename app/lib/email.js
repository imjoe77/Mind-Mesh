import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendSessionEmail({ to, groupName, subject, link }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `🚀 Session is LIVE: ${groupName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
        <h1 style="color: #4f46e5; font-size: 24px;">Your Study Session is LIVE!</h1>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          Hello! Your study group <strong>${groupName}</strong> has just started a session for <strong>${subject}</strong>.
        </p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_URL}${link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Join Session Now
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          Sent with ❤️ from MindMesh. If you didn't join this group, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    // Check if credentials are set (not the placeholders)
    if (!process.env.EMAIL_SERVER_USER || process.env.EMAIL_SERVER_USER.includes("your-email")) {
      console.log(`[EMAIL SIMULATOR] To: ${to} | Subject: Session LIVE | Msg: Your ${groupName} session is live!`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT] ID: ${info.messageId} to ${to}`);
    return { success: true, info };
  } catch (error) {
    console.error("[EMAIL ERROR]", error);
    return { success: false, error };
  }
}
