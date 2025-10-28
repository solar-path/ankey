import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";
import { UserService } from "./user-service";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/lib/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/lib/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/lib/ui/input-otp";
import { QPassword } from "@/lib/ui/QPassword.ui";
import { toast } from "sonner";
import { CheckCircle, Mail } from "lucide-react";

// Validation schemas
const acceptInvitationNewUserSchema = v.object({
  email: v.pipe(v.string(), v.email("Invalid email address")),
  code: v.pipe(v.string(), v.length(6, "Code must be 6 digits")),
  password: v.pipe(v.string(), v.minLength(8, "Password must be at least 8 characters")),
  confirmPassword: v.pipe(v.string(), v.minLength(8, "Password must be at least 8 characters")),
});

const acceptInvitationExistingUserSchema = v.object({
  email: v.pipe(v.string(), v.email("Invalid email address")),
  code: v.pipe(v.string(), v.length(6, "Code must be 6 digits")),
});

type AcceptInvitationNewUserInput = v.InferOutput<typeof acceptInvitationNewUserSchema>;
type AcceptInvitationExistingUserInput = v.InferOutput<typeof acceptInvitationExistingUserSchema>;

export default function AcceptInvitePage() {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [checkingUser, setCheckingUser] = useState(false);

  // Get email from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    if (email) {
      const decodedEmail = decodeURIComponent(email);
      console.log("Email from URL:", decodedEmail);
      setUserEmail(decodedEmail);
      checkUserStatus(decodedEmail);
    } else {
      console.warn("No email parameter found in URL");
    }
  }, [location]);

  const checkUserStatus = async (email: string) => {
    setCheckingUser(true);
    try {
      const user = await UserService.getUserByEmail(email);
      // If user is not verified, they're a new user who needs to set password
      // Invited users are created with verified: false
      setIsNewUser(user === null || !user.verified);
    } catch (error) {
      // If user not found, they're new
      setIsNewUser(true);
    } finally {
      setCheckingUser(false);
    }
  };

  const newUserForm = useForm<AcceptInvitationNewUserInput>({
    resolver: valibotResolver(acceptInvitationNewUserSchema),
    defaultValues: {
      email: userEmail,
      code: "",
      password: "",
      confirmPassword: "",
    },
  });

  const existingUserForm = useForm<AcceptInvitationExistingUserInput>({
    resolver: valibotResolver(acceptInvitationExistingUserSchema),
    defaultValues: {
      email: userEmail,
      code: "",
    },
  });

  // Update email in forms when userEmail changes
  useEffect(() => {
    if (userEmail) {
      newUserForm.setValue("email", userEmail);
      existingUserForm.setValue("email", userEmail);
    }
  }, [userEmail]);

  const onSubmitNewUser = async (data: AcceptInvitationNewUserInput) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Сценарий №1: Новый пользователь - verify account + set password
      await UserService.acceptInvitation(data.email, data.code, data.password);
      setSuccess(true);
      toast.success("Account verified! Please sign in.");

      setTimeout(() => {
        navigate("/auth/signin");
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept invitation");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitExistingUser = async (data: AcceptInvitationExistingUserInput) => {
    setLoading(true);
    try {
      // Существующий пользователь - просто ассоциируем с компанией
      await UserService.acceptInvitation(data.email, data.code);
      setSuccess(true);

      // Сценарий №2: Зарегистрирован, но НЕ авторизован
      if (!isAuthenticated) {
        toast.success("Invitation accepted! Please sign in.");
        setTimeout(() => {
          navigate("/auth/signin");
        }, 2000);
      } else {
        // Сценарий №3: Зарегистрирован И авторизован
        toast.success("Invitation accepted! Redirecting to company dashboard...");
        setTimeout(() => {
          navigate("/company");
        }, 2000);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept invitation");
    } finally {
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle>Invitation Accepted!</CardTitle>
            <CardDescription>
              {isNewUser
                ? "Your account has been verified. Redirecting to sign in..."
                : isAuthenticated
                  ? "Redirecting to company dashboard..."
                  : "Redirecting to sign in..."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // If email is missing or user status not determined, show error
  if (!userEmail || isNewUser === null) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation Link</CardTitle>
            <CardDescription>
              This invitation link is invalid or incomplete. Please check your email for the correct invitation link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth/signin")} className="w-full">
              Go to Sign In
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
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            {isNewUser
              ? "Enter your 6-digit code and create a password to verify your account"
              : "Enter your 6-digit code to accept the invitation"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isNewUser ? (
            <Form {...newUserForm}>
              <form onSubmit={newUserForm.handleSubmit(onSubmitNewUser)} className="space-y-4">
                {/* Email Field */}
                <FormField
                  control={newUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <input
                            type="email"
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            readOnly
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Verification Code */}
                <FormField
                  control={newUserForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <div className="flex justify-center">
                          <InputOTP maxLength={6} value={field.value} onChange={field.onChange}>
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
                      </FormControl>
                      <FormDescription>
                        Enter the 6-digit code from your email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* New Password */}
                <FormField
                  control={newUserForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Create Password</FormLabel>
                      <FormControl>
                        <QPassword
                          {...field}
                          placeholder="Enter password"
                          showStrength
                          showGenerator
                          onGeneratedPassword={(pwd: string) => {
                            field.onChange(pwd);
                            newUserForm.setValue("confirmPassword", pwd);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={newUserForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <QPassword {...field} placeholder="Confirm password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Accepting invitation..." : "Accept Invitation"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...existingUserForm}>
              <form onSubmit={existingUserForm.handleSubmit(onSubmitExistingUser)} className="space-y-4">
                {/* Email Field */}
                <FormField
                  control={existingUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <input
                            type="email"
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            readOnly
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Verification Code */}
                <FormField
                  control={existingUserForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <div className="flex justify-center">
                          <InputOTP maxLength={6} value={field.value} onChange={field.onChange}>
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
                      </FormControl>
                      <FormDescription>
                        Enter the 6-digit code from your email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                  {isAuthenticated
                    ? "You will be redirected to the company dashboard after accepting this invitation."
                    : "You'll use your existing password to sign in after accepting this invitation."}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Accepting invitation..." : "Accept Invitation"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
