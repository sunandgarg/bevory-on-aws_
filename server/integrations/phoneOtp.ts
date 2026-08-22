import bcrypt from "bcryptjs";
import { randomInt, randomUUID } from "node:crypto";
import { prisma } from "../db.js";

const normalizePhone = (phone: string) => {
  const normalized = phone.trim();
  if (!/^\+[1-9]\d{9,14}$/.test(normalized)) throw new Error("A valid E.164 phone number is required");
  return normalized;
};

const twilioConfigured = () => Boolean(
  process.env.TWILIO_ACCOUNT_SID?.trim()
  && process.env.TWILIO_AUTH_TOKEN?.trim()
  && process.env.TWILIO_FROM_NUMBER?.trim(),
);

export const phoneOtpConfigured = () =>
  twilioConfigured() || (process.env.NODE_ENV !== "production" && Boolean(process.env.OTP_TEST_CODE));

const sendTwilioMessage = async (phone: string, code: string) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN!.trim();
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: phone,
      From: process.env.TWILIO_FROM_NUMBER!.trim(),
      Body: `Your Bevory verification code is ${code}. It expires in 10 minutes.`,
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message || `Twilio SMS failed (${response.status})`);
  }
};

export const sendPhoneOtp = async (phoneInput: string) => {
  const phone = normalizePhone(phoneInput);
  if (!phoneOtpConfigured()) throw new Error("Phone OTP is not configured");
  const latest = await prisma.otpChallenge.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (latest && Date.now() - latest.createdAt.getTime() < 60_000) {
    throw new Error("Please wait 60 seconds before requesting another code");
  }
  await prisma.otpChallenge.deleteMany({ where: { phone } });
  const testCode = process.env.NODE_ENV !== "production" ? process.env.OTP_TEST_CODE?.trim() : undefined;
  const code = testCode || String(randomInt(100000, 1_000_000));
  if (!testCode) await sendTwilioMessage(phone, code);
  await prisma.otpChallenge.create({
    data: {
      id: randomUUID(),
      phone,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    },
  });
  return { phone, expiresIn: 600 };
};

export const verifyPhoneOtp = async (phoneInput: string, code: string) => {
  const phone = normalizePhone(phoneInput);
  if (!/^\d{6}$/.test(code)) throw new Error("A valid 6-digit code is required");
  const challenge = await prisma.otpChallenge.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (!challenge || challenge.expiresAt.getTime() <= Date.now()) {
    if (challenge) await prisma.otpChallenge.delete({ where: { id: challenge.id } });
    throw new Error("Verification code has expired or does not exist");
  }
  if (challenge.attempts >= 5) throw new Error("Too many verification attempts; request a new code");
  if (!await bcrypt.compare(code, challenge.codeHash)) {
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    throw new Error("Invalid verification code");
  }
  await prisma.otpChallenge.deleteMany({ where: { phone } });
  return phone;
};
