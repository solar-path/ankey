"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Upload } from "lucide-react";
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
import { client } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const profileSchema = z.object({
  fullname: z.string().min(1, "Full name is required"),
  dob: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [date, setDate] = useState<Date | undefined>();
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const gender = watch("gender");

  useEffect(() => {
    // Load user profile data
    const loadProfile = async () => {
      try {
        const { data, error } = await (client as any)(
          "/api/auth/profile/data",
          {
            method: "GET",
          }
        );
        if (error) {
          console.error("Failed to load profile:", error);
          return;
        }

        setValue("fullname", data.profile.fullname || "");
        setAvatarUrl(data.profile.avatar || "");

        // Load DOB if exists
        if (data.profile.dob) {
          const dobDate = new Date(data.profile.dob);
          setDate(dobDate);
          setValue("dob", data.profile.dob);
        }

        // Load gender if exists
        if (data.profile.gender) {
          setValue("gender", data.profile.gender);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };
    loadProfile();
  }, [setValue, user]);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
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
        toast.success("Avatar uploaded successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const { error } = await (client as any)("/api/auth/profile", {
        method: "PUT",
        body: data,
      });

      if (error) {
        toast.error(
          (error.value as any)?.message || "Failed to update profile"
        );
        return;
      }

      await refreshUser(); // Refresh user data to update profile across the app
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
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
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your profile information</CardDescription>
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
                {uploading ? "Uploading..." : "Upload Avatar"}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF (max 5MB)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email || ""} disabled />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullname">Full Name</Label>
            <Input id="fullname" type="text" {...register("fullname")} />
            {errors.fullname && (
              <p className="text-sm text-destructive">
                {errors.fullname.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <QDatePicker
              id="dob"
              value={date}
              onChange={(newDate) => {
                setDate(newDate);
                if (newDate) {
                  setValue("dob", format(newDate, "yyyy-MM-dd"));
                }
              }}
              placeholder="Select date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={gender}
              onValueChange={(value) =>
                setValue(
                  "gender",
                  value as "male" | "female" | "other" | "prefer-not-to-say"
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">
                  Prefer not to say
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
