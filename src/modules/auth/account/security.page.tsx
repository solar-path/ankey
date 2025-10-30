import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { useAuth } from "@/lib/auth-context";
import { AuthService } from "@/modules/auth/auth-service";

export default function SecurityPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
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
  }, [user]);

  const loadTwoFactorStatus = async () => {
    try {
      if (!user?._id) {
        setLoading(false);
        return;
      }

      const status = await AuthService.get2FAStatus(user._id);
      setTwoFactorStatus(status);
    } catch (error) {
      console.error("Failed to load 2FA status:", error);
      toast.error(t('auth.account.security.messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      if (!user?._id) {
        toast.error(t('auth.account.security.messages.userNotFound'));
        return;
      }

      const { secret: newSecret, qrCode: newQrCode } = await AuthService.setup2FA(user._id);
      setSecret(newSecret);
      setQrCode(newQrCode);
      setSetupStep("qr");
      toast.success(t('auth.account.security.messages.qrGenerated'));
    } catch (error: any) {
      console.error("2FA setup error:", error);
      toast.error(error.message || t('auth.account.security.messages.setupError'));
    }
  };

  const handleVerify2FA = async () => {
    try {
      if (!user?._id) {
        toast.error(t('auth.account.security.messages.userNotFound'));
        return;
      }

      if (otpToken.length !== 6) {
        toast.error(t('auth.account.security.messages.invalidCode'));
        return;
      }

      await AuthService.enable2FA(user._id, otpToken);
      toast.success(t('auth.account.security.messages.enabled'));
      setSetupStep("idle");
      setOtpToken("");
      setQrCode("");
      setSecret("");
      await loadTwoFactorStatus();
    } catch (error: any) {
      console.error("2FA verification error:", error);
      toast.error(error.message || t('auth.account.security.messages.invalidCodeError'));
    }
  };

  const handleDisable2FA = async () => {
    try {
      if (!user?._id) {
        toast.error(t('auth.account.security.messages.userNotFound'));
        return;
      }

      if (disableToken.length !== 6) {
        toast.error(t('auth.account.security.messages.invalidCode'));
        return;
      }

      await AuthService.disable2FA(user._id, disableToken);
      toast.success(t('auth.account.security.messages.disabled'));
      setDisableToken("");
      await loadTwoFactorStatus();
    } catch (error: any) {
      console.error("2FA disable error:", error);
      toast.error(error.message || t('auth.account.security.messages.disableError'));
    }
  };

  if (loading) {
    return <div>{t('auth.account.security.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>{t('auth.account.security.changePassword.title')}</CardTitle>
          </div>
          <CardDescription>{t('auth.account.security.changePassword.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* 2FA Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.account.security.twoFA.title')}</CardTitle>
          <CardDescription>
            {t('auth.account.security.twoFA.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {twoFactorStatus?.enabled ? (
              <>
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-500">
                  {t('auth.account.security.twoFA.enabled')}
                </span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t('auth.account.security.twoFA.disabled')}
                </span>
              </>
            )}
          </div>

          {/* Global Requirement Warning */}
          {twoFactorStatus?.required && !twoFactorStatus?.enabled && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('auth.account.security.twoFA.required')}
                {twoFactorStatus?.deadline && (
                  <>
                    {" "}
                    {t('auth.account.security.twoFA.deadline', {
                      date: new Date(twoFactorStatus.deadline).toLocaleDateString()
                    })}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {twoFactorStatus?.required && twoFactorStatus?.enabled && (
            <Alert>
              <AlertDescription>
                {t('auth.account.security.twoFA.cannotDisable')}
              </AlertDescription>
            </Alert>
          )}

          {/* Setup Flow */}
          {!twoFactorStatus?.enabled && setupStep === "idle" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('auth.account.security.twoFA.setupInstructions')}
              </p>
              <Button onClick={handleSetup2FA}>{t('auth.account.security.twoFA.enableButton')}</Button>
            </div>
          )}

          {setupStep === "qr" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm font-medium">
                  {t('auth.account.security.twoFA.scanQR')}
                </p>
                {qrCode && (
                  <img
                    src={qrCode}
                    alt="2FA QR Code"
                    className="border rounded-lg p-4"
                  />
                )}
                <div className="text-xs text-muted-foreground text-center">
                  <p>{t('auth.account.security.twoFA.manualEntry')}</p>
                  <code className="bg-muted px-2 py-1 rounded">{secret}</code>
                </div>
              </div>
              <Button onClick={() => setSetupStep("verify")} className="w-full">
                {t('auth.account.security.twoFA.continueButton')}
              </Button>
            </div>
          )}

          {setupStep === "verify" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {t('auth.account.security.twoFA.enterCode')}
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
                  {t('auth.account.security.twoFA.verifyButton')}
                </Button>
                <Button variant="outline" onClick={() => setSetupStep("idle")}>
                  {t('auth.account.security.twoFA.cancelButton')}
                </Button>
              </div>
            </div>
          )}

          {/* Disable 2FA */}
          {twoFactorStatus?.enabled && !twoFactorStatus?.required && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium text-destructive">
                {t('auth.account.security.twoFA.disableTitle')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('auth.account.security.twoFA.disableInstructions')}
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
                {t('auth.account.security.twoFA.disableButton')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
