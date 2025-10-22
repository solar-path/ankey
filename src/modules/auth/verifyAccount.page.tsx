import { Button } from "@/lib/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/lib/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/lib/ui/input-otp";
import { useLocation } from "wouter";
import { AuthService } from "./auth-service";
import { toast } from "sonner";
import { useState } from "react";

export default function VerifyAccountPage() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthService.verifyAccount(code);
      toast.success("Account verified successfully! You can now sign in.");
      setLocation("/auth/signin");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Account</CardTitle>
          <CardDescription>
            Enter the 6-digit verification code sent to your email
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Enter the 6-digit verification code
              </p>
              <div className="flex justify-center mb-2">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(value) => setCode(value)}
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
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || code.length !== 6}
            >
              {isSubmitting ? "Verifying..." : "Verify Account"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
