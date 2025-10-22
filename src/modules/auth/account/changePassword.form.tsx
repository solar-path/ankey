import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";
import { Button } from "@/lib/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/lib/ui/form";
import { QPassword } from "@/lib/ui/QPassword.ui";
import { client } from "@/lib/api-client";
import { toast } from "sonner";

const passwordSchema = v.pipe(
  v.object({
    currentPassword: v.pipe(
      v.string(),
      v.minLength(1, "Current password is required")
    ),
    newPassword: v.pipe(
      v.string(),
      v.minLength(8, "Password must be at least 8 characters")
    ),
    confirmPassword: v.pipe(
      v.string(),
      v.minLength(1, "Please confirm your password")
    ),
  }),
  v.forward(
    v.partialCheck(
      [["newPassword"], ["confirmPassword"]],
      (input) => input.newPassword === input.confirmPassword,
      "Passwords don't match"
    ),
    ["confirmPassword"]
  )
);

type PasswordFormData = v.InferOutput<typeof passwordSchema>;

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const form = useForm<PasswordFormData>({
    resolver: valibotResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      const { error } = await (client as any)("/api/auth/change-password", {
        method: "POST",
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        },
      });

      if (error) {
        const errorMessage =
          (error.value as any)?.error || "Failed to change password";
        toast.error(errorMessage);
        return;
      }

      toast.success("Password changed successfully!");
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Failed to change password");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <QPassword {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <QPassword
                  {...field}
                  showStrength={true}
                  showGenerator={true}
                  onGeneratedPassword={(pwd) => {
                    // Update both new password and confirm password with generated password
                    form.setValue("newPassword", pwd);
                    form.setValue("confirmPassword", pwd);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <QPassword {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Changing..." : "Change Password"}
        </Button>
      </form>
    </Form>
  );
}
