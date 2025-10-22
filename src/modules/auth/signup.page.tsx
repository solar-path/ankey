import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { signUpSchema, type SignUpInput } from "@/modules/auth/auth.valibot";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { QPassword } from "@/lib/ui/QPassword.ui";
import { Checkbox } from "@/lib/ui/checkbox";
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
import { Link, useLocation } from "wouter";
import { AuthService } from "@/lib/auth-service";
import { toast } from "sonner";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const form = useForm({
    resolver: valibotResolver(signUpSchema),
    defaultValues: {
      agreeToTerms: true,
    },
  });

  const onSubmit = async (data: SignUpInput) => {
    try {
      await AuthService.signUp(data);
      toast.success(
        `Welcome, ${data.email}! Check your email for verification code.`
      );
      setLocation("/auth/verify-account");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An error occurred. Please try again."
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create your account to get started</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="fullname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <QPassword
                        placeholder="••••••••"
                        showStrength={true}
                        showGenerator={true}
                        onGeneratedPassword={(pwd) => {
                          field.onChange(pwd);
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 mb-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer !mt-0">
                      I agree to the{" "}
                      <Link
                        href="/learn?doc=terms"
                        className="text-primary hover:underline"
                      >
                        Terms of Service
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Creating account..."
                  : "Sign Up"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
