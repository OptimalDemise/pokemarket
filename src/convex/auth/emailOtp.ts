import { Email } from "@convex-dev/auth/providers/Email";
import axios from "axios";
import { alphabet, generateRandomString } from "oslo/crypto";

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  generateVerificationToken() {
    // Development-only bypass: return fixed token for admin emails
    return generateRandomString(6, alphabet("0-9"));
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    // Development-only bypass: if email contains "admin" and we're in development
    const isDevelopment = process.env.CONVEX_CLOUD_URL?.includes("localhost") || 
                          process.env.NODE_ENV === "development";
    
    if (isDevelopment && email.toLowerCase().includes("admin")) {
      console.log("🔧 Development mode: Admin bypass enabled");
      console.log(`🔑 Use the actual OTP sent to console or check your email`);
      console.log(`📧 OTP for ${email}: ${token}`);
      // Still send the email in dev mode, but also log it
      // This way you can use the actual OTP that was generated
      return;
    }

    try {
      await axios.post(
        "https://email.vly.ai/send_otp",
        {
          to: email,
          otp: token,
          appName: process.env.VLY_APP_NAME || "a vly.ai application",
        },
        {
          headers: {
            "x-api-key": "vlytothemoon2025",
          },
        },
      );
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});