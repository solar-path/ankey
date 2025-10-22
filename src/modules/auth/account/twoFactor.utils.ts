import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";

/**
 * Generate a new 2FA secret for a user
 */
export function generateTwoFactorSecret() {
  const secret = new Secret({ size: 20 });
  return secret.base32;
}

/**
 * Generate QR code data URL for Google Authenticator
 */
export async function generateQRCode(
  userEmail: string,
  secret: string
): Promise<string> {
  const totp = new TOTP({
    issuer: "YSollo",
    label: userEmail,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });

  const otpauthUrl = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return qrCodeDataUrl;
}

/**
 * Verify a 2FA token against a secret
 */
export function verifyTwoFactorToken(secret: string, token: string): boolean {
  const totp = new TOTP({
    issuer: "YSollo",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });

  // Allow 1 period (30s) window for clock skew
  const delta = totp.validate({ token, window: 1 });

  return delta !== null;
}
