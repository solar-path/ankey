import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
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
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { AuthService } from "@/modules/auth/auth-service";

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const passwordSchema = useMemo(() => v.pipe(
    v.object({
      currentPassword: v.pipe(
        v.string(),
        v.minLength(1, t('auth.account.security.changePassword.currentPasswordRequired'))
      ),
      newPassword: v.pipe(
        v.string(),
        v.minLength(8, t('auth.account.security.changePassword.newPasswordMinLength'))
      ),
      confirmPassword: v.pipe(
        v.string(),
        v.minLength(1, t('auth.account.security.changePassword.confirmPasswordRequired'))
      ),
    }),
    v.forward(
      v.partialCheck(
        [["newPassword"], ["confirmPassword"]],
        (input) => input.newPassword === input.confirmPassword,
        t('auth.account.security.changePassword.passwordsDontMatch')
      ),
      ["confirmPassword"]
    )
  ), [t]);

  type PasswordFormData = v.InferOutput<typeof passwordSchema>;
  const form = useForm<PasswordFormData>({
    resolver: valibotResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      if (!user?._id) {
        toast.error(t('auth.account.security.messages.userNotFound'));
        return;
      }

      await AuthService.changePassword(
        user._id,
        data.currentPassword,
        data.newPassword
      );

      toast.success(t('auth.account.security.changePassword.success'));
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error(error.message || t('auth.account.security.changePassword.error'));
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
              <FormLabel>{t('auth.account.security.changePassword.currentPasswordLabel')}</FormLabel>
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
              <FormLabel>{t('auth.account.security.changePassword.newPasswordLabel')}</FormLabel>
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
              <FormLabel>{t('auth.account.security.changePassword.confirmPasswordLabel')}</FormLabel>
              <FormControl>
                <QPassword {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('auth.account.security.changePassword.changingButton') : t('auth.account.security.changePassword.changeButton')}
        </Button>
      </form>
    </Form>
  );
}
