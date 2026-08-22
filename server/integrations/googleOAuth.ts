import type { Request } from "express";

type GoogleTokenResponse = { access_token?: string; error_description?: string };
type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

export const googleOAuthConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());

export const googleRedirectUri = (req: Request) =>
  process.env.GOOGLE_REDIRECT_URI?.trim()
  || `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

export const buildGoogleAuthorizationUrl = (redirectUri: string, state: string) => {
  const params = new URLSearchParams({
    client_id: required("GOOGLE_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

export const exchangeGoogleCode = async (code: string, redirectUri: string) => {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: required("GOOGLE_CLIENT_ID"),
      client_secret: required("GOOGLE_CLIENT_SECRET"),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const token = await tokenResponse.json() as GoogleTokenResponse;
  if (!tokenResponse.ok || !token.access_token) {
    throw new Error(token.error_description || "Google token exchange failed");
  }
  const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const profile = await userResponse.json() as GoogleUserInfo;
  if (!userResponse.ok || !profile.sub || !profile.email || profile.email_verified !== true) {
    throw new Error("Google did not return a verified email identity");
  }
  return {
    providerId: profile.sub,
    email: profile.email,
    fullName: profile.name,
    avatarUrl: profile.picture,
  };
};
