import { useState } from "react";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import {
  signInSchema,
  type SignInInput,
} from "@/modules/auth/auth.valibot";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/lib/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/lib/ui/form";
import { QPassword } from "@/lib/ui/QPassword.ui";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/lib/ui/input-otp";
import { Link, useLocation } from "wouter";
import { AuthService } from "./auth-service";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [requires2FA, setRequires2FA] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<SignInInput>({
    resolver: valibotResolver(signInSchema),
  });

  const onSubmit = async (data: SignInInput) => {
    try {
      const result = await AuthService.signIn(data);

      // Check if 2FA is required
      if (result.requires2FA) {
        setRequires2FA(true);
        setUserEmail(result.user?.email || data.email);
        toast.info("Please enter your 6-digit authentication code");
        return;
      }

      // Normal signin flow
      toast.success(`Welcome, ${result.user.email}!`);
      login(result.user as any, result.session as any);
      setLocation("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An error occurred. Please try again."
      );
    }
  };

  const handleVerify2FA = async () => {
    if (otpToken.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await AuthService.verify2FA(userEmail, otpToken);
      toast.success(`Welcome, ${result.user.email}!`);
      login(result.user as any, result.session as any);
      setLocation("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An error occurred. Please try again."
      );
      setIsVerifying(false);
    }
  };

  if (requires2FA) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
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
            <Button
              onClick={handleVerify2FA}
              disabled={otpToken.length !== 6 || isVerifying}
              className="w-full"
            >
              {isVerifying ? "Verifying..." : "Verify and Sign In"}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setRequires2FA(false);
                setOtpToken("");
              }}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="m@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/auth/forgot-password"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <FormControl>
                      <QPassword placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-primary hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
