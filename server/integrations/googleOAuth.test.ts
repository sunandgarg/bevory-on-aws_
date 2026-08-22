import { afterEach, describe, expect, it } from "vitest";
import { buildGoogleAuthorizationUrl, googleOAuthConfigured } from "./googleOAuth.js";

const originalClientId = process.env.GOOGLE_CLIENT_ID;
const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;

afterEach(() => {
  if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
  else process.env.GOOGLE_CLIENT_ID = originalClientId;
  if (originalClientSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
  else process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
});

describe("Google OAuth configuration", () => {
  it("reports missing credentials", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(googleOAuthConfigured()).toBe(false);
  });

  it("builds a state-bound authorization URL", () => {
    process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
    process.env.GOOGLE_CLIENT_SECRET = "test-secret";
    const url = new URL(buildGoogleAuthorizationUrl("http://localhost:3001/api/auth/google/callback", "signed-state"));
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("client_id")).toBe("test-client.apps.googleusercontent.com");
    expect(url.searchParams.get("state")).toBe("signed-state");
    expect(url.searchParams.get("scope")).toContain("email");
  });
});
