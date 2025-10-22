import { useState, useEffect } from "react";
import { Button } from "@/lib/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import { Alert, AlertDescription } from "@/lib/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/lib/ui/input-otp";
import { toast } from "sonner";
import { Shield, ShieldCheck, AlertTriangle, Key } from "lucide-react";
import { ChangePasswordForm } from "./changePassword.form";

export default function SecurityPage() {
  const [twoFactorStatus, setTwoFactorStatus] = useState<{
    enabled: boolean;
    required: boolean;
    deadline: string | null;
  } | null>(null);
  const [setupStep, setSetupStep] = useState<"idle" | "qr" | "verify">("idle");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [otpToken, setOtpToken] = useState<string>("");
  const [disableToken, setDisableToken] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  const loadTwoFactorStatus = async () => {
    try {
      // TODO: Implement 2FA status check with PouchDB
      // For now, just set default status
      setTwoFactorStatus({
        enabled: false,
        required: false,
        deadline: null,
      });
    } catch (error) {
      console.error("Failed to load 2FA status:", error);
      toast.error("Failed to load 2FA status");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    // TODO: Implement 2FA setup with PouchDB
    toast.info("2FA setup is not yet implemented");
  };

  const handleVerify2FA = async () => {
    // TODO: Implement 2FA verification with PouchDB
    toast.info("2FA verification is not yet implemented");
  };

  const handleDisable2FA = async () => {
    // TODO: Implement 2FA disable with PouchDB
    toast.info("2FA disable is not yet implemented");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* 2FA Card */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {twoFactorStatus?.enabled ? (
              <>
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-500">
                  2FA is enabled
                </span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  2FA is disabled
                </span>
              </>
            )}
          </div>

          {/* Global Requirement Warning */}
          {twoFactorStatus?.required && !twoFactorStatus?.enabled && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your organization requires two-factor authentication.
                {twoFactorStatus?.deadline && (
                  <>
                    {" "}
                    Deadline:{" "}
                    {new Date(twoFactorStatus.deadline).toLocaleDateString()}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {twoFactorStatus?.required && twoFactorStatus?.enabled && (
            <Alert>
              <AlertDescription>
                2FA is required by your organization and cannot be disabled.
              </AlertDescription>
            </Alert>
          )}

          {/* Setup Flow */}
          {!twoFactorStatus?.enabled && setupStep === "idle" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use Google Authenticator or any compatible TOTP app to scan the
                QR code and enable two-factor authentication.
              </p>
              <Button onClick={handleSetup2FA}>Enable 2FA</Button>
            </div>
          )}

          {setupStep === "qr" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm font-medium">
                  Scan this QR code with your authenticator app:
                </p>
                {qrCode && (
                  <img
                    src={qrCode}
                    alt="2FA QR Code"
                    className="border rounded-lg p-4"
                  />
                )}
                <div className="text-xs text-muted-foreground text-center">
                  <p>Or enter this secret key manually:</p>
                  <code className="bg-muted px-2 py-1 rounded">{secret}</code>
                </div>
              </div>
              <Button onClick={() => setSetupStep("verify")} className="w-full">
                Continue to Verification
              </Button>
            </div>
          )}

          {setupStep === "verify" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Enter the 6-digit code from your authenticator app:
                </p>
                <InputOTP maxLength={6} value={otpToken} onChange={setOtpToken}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleVerify2FA}
                  disabled={otpToken.length !== 6}
                >
                  Verify and Enable
                </Button>
                <Button variant="outline" onClick={() => setSetupStep("idle")}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Disable 2FA */}
          {twoFactorStatus?.enabled && !twoFactorStatus?.required && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium text-destructive">
                Disable Two-Factor Authentication
              </p>
              <p className="text-sm text-muted-foreground">
                Enter a code from your authenticator app to disable 2FA:
              </p>
              <InputOTP
                maxLength={6}
                value={disableToken}
                onChange={setDisableToken}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={disableToken.length !== 6}
              >
                Disable 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
