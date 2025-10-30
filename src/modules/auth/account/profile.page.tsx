"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";
import { format } from "date-fns";
import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { Label } from "@/lib/ui/label";
import { QDatePicker } from "@/lib/ui/QDatePicker.ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/lib/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { updateProfileSchema } from "@/modules/auth/auth.valibot";
import { AuthService } from "@/modules/auth/auth-service";

type ProfileFormData = v.InferOutput<typeof updateProfileSchema>;

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [date, setDate] = useState<Date | undefined>();
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: valibotResolver(updateProfileSchema),
    defaultValues: {
      fullname: "",
      email: "",
      dob: "",
      gender: undefined,
    },
  });

  useEffect(() => {
    // Load user profile data from auth context
    if (user) {
      const genderValue = user.profile?.gender;

      // Use reset to set all values at once
      reset({
        fullname: user.fullname || "",
        email: user.email || "",
        dob: user.profile?.dob || "",
        gender: genderValue as any,
      });

      setAvatarUrl(user.avatar || user.profile?.avatar || "");

      // Load DOB if exists
      if (user.profile?.dob) {
        const dobDate = new Date(user.profile.dob);
        setDate(dobDate);
      } else {
        setDate(undefined);
      }

      if (!isInitialized) {
        setIsInitialized(true);
      }
    }
  }, [user, reset, isInitialized]);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t('auth.account.profile.messages.invalidFile'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('auth.account.profile.messages.fileTooLarge'));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/auth/upload-avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.avatarUrl);
        await refreshUser(); // Refresh user data to update avatar in sidebar
        toast.success(t('auth.account.profile.messages.avatarUploaded'));
      } else {
        const error = await response.json();
        toast.error(error.error || t('auth.account.profile.messages.avatarError'));
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(t('auth.account.profile.messages.avatarError'));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      if (!user?._id) {
        toast.error(t('auth.account.profile.messages.userNotFound'));
        return;
      }

      await AuthService.updateProfile(user._id, {
        fullname: data.fullname,
        dob: data.dob,
        gender: data.gender,
      });

      await refreshUser(); // Refresh user data to update profile across the app
      toast.success(t('auth.account.profile.messages.updated'));
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || t('auth.account.profile.messages.updateError'));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.account.profile.title')}</CardTitle>
        <CardDescription>{t('auth.account.profile.subtitle')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={avatarUrl || user?.profile?.avatar}
                alt={user?.email || ""}
              />
              <AvatarFallback>
                {user?.email ? getInitials(user.email) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? t('auth.account.profile.uploading') : t('auth.account.profile.uploadAvatar')}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t('auth.account.profile.avatarHelp')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.account.profile.emailLabel')}</Label>
            <Input id="email" type="email" value={user?.email || ""} disabled />
            <p className="text-sm text-muted-foreground">
              {t('auth.account.profile.emailHelp')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullname">{t('auth.account.profile.fullNameLabel')}</Label>
            <Input id="fullname" type="text" {...register("fullname")} />
            {errors.fullname && (
              <p className="text-sm text-destructive">
                {errors.fullname.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">{t('auth.account.profile.dateOfBirthLabel')}</Label>
            <QDatePicker
              id="dob"
              value={date}
              onChange={(newDate) => {
                setDate(newDate);
                if (newDate) {
                  setValue("dob", format(newDate, "yyyy-MM-dd"));
                }
              }}
              placeholder={t('auth.account.profile.dateOfBirthPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">{t('auth.account.profile.genderLabel')}</Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select
                  key={user?.profile?.gender || "no-gender"}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('auth.account.profile.genderPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('auth.account.profile.genderOptions.male')}</SelectItem>
                    <SelectItem value="female">{t('auth.account.profile.genderOptions.female')}</SelectItem>
                    <SelectItem value="other">{t('auth.account.profile.genderOptions.other')}</SelectItem>
                    <SelectItem value="prefer-not-to-say">
                      {t('auth.account.profile.genderOptions.preferNotToSay')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('auth.account.profile.savingButton') : t('auth.account.profile.saveButton')}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
