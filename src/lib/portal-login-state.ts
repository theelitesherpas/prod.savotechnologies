export type PortalKind = "client" | "employee";
export type PortalLoginState = {
  stage: "credentials" | "code";
  error?: string;
  email?: string;
  challengeId?: string;
  resendAt?: number;
  expiresAt?: number;
};

export const INITIAL_PORTAL_LOGIN: PortalLoginState = { stage: "credentials" };
