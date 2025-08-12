import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import { createHash, randomBytes } from 'crypto'

export interface TwoFactorSetupData {
  secret: string
  backupCodes: string[]
  qrCodeUrl: string
  manualEntryKey: string
}

export interface TwoFactorTokenData {
  token: string
  expiresAt: Date
}

export class TwoFactorService {
  /**
   * Generate TOTP secret and QR code for initial setup
   */
  static async generateTOTPSetup(
    userEmail: string,
    serviceName: string = 'Ankey'
  ): Promise<TwoFactorSetupData> {
    console.log('TwoFactorService.generateTOTPSetup called for:', userEmail)
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: serviceName,
      length: 20,
    })
    
    console.log('Generated secret:', secret)
    console.log('OTPAUTH URL:', secret.otpauth_url)

    // Generate backup codes (10 codes)
    const backupCodes = Array.from({ length: 10 }, () =>
      randomBytes(4).toString('hex').toUpperCase()
    )
    
    console.log('Generated backup codes:', backupCodes)

    // Generate QR code URL
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!)
    console.log('Generated QR Code URL length:', qrCodeUrl?.length || 'undefined')

    const result = {
      secret: secret.base32!,
      backupCodes,
      qrCodeUrl,
      manualEntryKey: secret.base32!,
    }
    
    console.log('Final result:', result)
    
    return result
  }

  /**
   * Verify TOTP code
   */
  static verifyTOTP(secret: string, token: string, window: number = 1): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window, // Allow 1 step before/after for time drift
    })
  }

  /**
   * Generate email 2FA token (6-digit code)
   */
  static generateEmailToken(): TwoFactorTokenData {
    const token = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10) // 10-minute expiry

    return {
      token,
      expiresAt,
    }
  }

  /**
   * Verify email 2FA token
   */
  static verifyEmailToken(
    storedToken: string,
    providedToken: string,
    expiresAt: Date,
    used: boolean = false
  ): boolean {
    if (used) {
      return false
    }

    if (new Date() > expiresAt) {
      return false
    }

    return storedToken === providedToken
  }

  /**
   * Hash backup codes for storage
   */
  static hashBackupCodes(codes: string[]): string[] {
    return codes.map(code => 
      createHash('sha256').update(code.toLowerCase()).digest('hex')
    )
  }

  /**
   * Verify backup code
   */
  static verifyBackupCode(hashedCodes: string[], providedCode: string): boolean {
    const hashedProvidedCode = createHash('sha256')
      .update(providedCode.toLowerCase())
      .digest('hex')
    
    return hashedCodes.includes(hashedProvidedCode)
  }

  /**
   * Remove used backup code
   */
  static removeUsedBackupCode(hashedCodes: string[], usedCode: string): string[] {
    const hashedUsedCode = createHash('sha256')
      .update(usedCode.toLowerCase())
      .digest('hex')
    
    return hashedCodes.filter(code => code !== hashedUsedCode)
  }

  /**
   * Generate current TOTP token (for testing purposes)
   */
  static generateCurrentTOTP(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
    })
  }
}