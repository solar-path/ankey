import * as v from "valibot";

/**
 * Auth Models - Validation schemas using Valibot
 * Valibot is fast, modular, and works on both server and frontend
 * Exported schemas can be used with react-hook-form via @hookform/resolvers/valibot
 */

// Sign Up Schema
export const signUpSchema = v.object({
  email: v.pipe(v.string(), v.email("Invalid email address")),
  password: v.pipe(
    v.string(),
    v.minLength(8, "Password must be at least 8 characters")
  ),
  fullname: v.pipe(
    v.string(),
    v.minLength(2, "Full name must be at least 2 characters")
  ),
  agreeToTerms: v.pipe(
    v.boolean(),
    v.literal(true, "You must agree to terms and conditions")
  ),
});

// Sign In Schema
export const signInSchema = v.object({
  email: v.pipe(v.string(), v.email("Invalid email address")),
  password: v.pipe(
    v.string(),
    v.minLength(8, "Password must be at least 8 characters")
  ),
});

// Verify 2FA Schema
export const verify2FASchema = v.object({
  email: v.pipe(v.string(), v.email("Invalid email address")),
  token: v.pipe(v.string(), v.length(6, "Token must be 6 characters")),
});

// Forgot Password Schema
export const forgotPasswordSchema = v.object({
  email: v.pipe(v.string(), v.email("Invalid email address")),
});

// Verify Account Schema
export const verifyAccountSchema = v.object({
  code: v.pipe(
    v.string(),
    v.length(6, "Verification code must be 6 characters")
  ),
});

// Change Password Schema
export const changePasswordSchema = v.pipe(
  v.object({
    currentPassword: v.pipe(
      v.string(),
      v.minLength(8, "Password must be at least 8 characters")
    ),
    newPassword: v.pipe(
      v.string(),
      v.minLength(8, "Password must be at least 8 characters")
    ),
    confirmPassword: v.pipe(
      v.string(),
      v.minLength(8, "Password must be at least 8 characters")
    ),
  }),
  v.forward(
    v.partialCheck(
      [["newPassword"], ["confirmPassword"]],
      (input) => input.newPassword === input.confirmPassword,
      "Passwords do not match"
    ),
    ["confirmPassword"]
  )
);

// Update Profile Schema
export const updateProfileSchema = v.object({
  email: v.optional(v.pipe(v.string(), v.email("Invalid email address"))),
  fullname: v.optional(
    v.pipe(
      v.string(),
      v.minLength(2, "Full name must be at least 2 characters")
    )
  ),
  dob: v.optional(v.string()),
  gender: v.optional(
    v.picklist(["male", "female", "other", "prefer-not-to-say"])
  ),
});

// Update Contact Schema
export const updateContactSchema = v.object({
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  city: v.optional(v.string()),
  state: v.optional(v.string()),
  zipCode: v.optional(v.string()),
  country: v.optional(v.string()),
});

// Organization Settings Schema (renamed from tenant)
export const organizationSettingsSchema = v.object({
  country: v.optional(
    v.pipe(v.string(), v.minLength(2, "Please select a country"))
  ),
  currency: v.optional(
    v.pipe(v.string(), v.minLength(3, "Please select a currency"))
  ),
  timezone: v.optional(
    v.pipe(v.string(), v.minLength(1, "Please select a timezone"))
  ),
  language: v.optional(
    v.pipe(v.string(), v.minLength(2, "Please select a language"))
  ),
  twoFactorRequired: v.optional(v.boolean()),
  twoFactorDeadline: v.optional(v.nullable(v.string())),
  passwordChangeDays: v.optional(v.number()),
});

// Keep old name for backward compatibility
export const tenantSettingsSchema = organizationSettingsSchema;

// Enable 2FA Schema
export const enable2FASchema = v.object({
  token: v.pipe(v.string(), v.length(6, "Token must be 6 characters")),
});

// Disable 2FA Schema
export const disable2FASchema = v.object({
  token: v.pipe(v.string(), v.length(6, "Token must be 6 characters")),
});

// ==================== USER MANAGEMENT SCHEMAS ====================

// Invite User Schema (with company associations)
export const inviteUserSchema = v.object({
  email: v.pipe(v.string(), v.email("Invalid email address")),
  sendEmail: v.optional(v.boolean()),
  companyIds: v.optional(v.array(v.string())),
});

// Update User Companies Schema
export const updateUserCompaniesSchema = v.object({
  companyIds: v.array(v.string()),
});

// Block User Schema
export const blockUserSchema = v.object({
  reason: v.pipe(
    v.string(),
    v.minLength(10, "Reason must be at least 10 characters")
  ),
});

// TypeScript types inferred from schemas
export type SignUpInput = v.InferOutput<typeof signUpSchema>;
export type SignInInput = v.InferOutput<typeof signInSchema>;
export type Verify2FAInput = v.InferOutput<typeof verify2FASchema>;
export type ForgotPasswordInput = v.InferOutput<typeof forgotPasswordSchema>;
export type VerifyAccountInput = v.InferOutput<typeof verifyAccountSchema>;
export type ChangePasswordInput = v.InferOutput<typeof changePasswordSchema>;
export type UpdateProfileInput = v.InferOutput<typeof updateProfileSchema>;
export type UpdateContactInput = v.InferOutput<typeof updateContactSchema>;
export type OrganizationSettingsInput = v.InferOutput<
  typeof organizationSettingsSchema
>;
export type TenantSettingsInput = v.InferOutput<typeof tenantSettingsSchema>; // Backward compatibility
export type Enable2FAInput = v.InferOutput<typeof enable2FASchema>;
export type Disable2FAInput = v.InferOutput<typeof disable2FASchema>;

// User Management types
export type InviteUserInput = v.InferOutput<typeof inviteUserSchema>;
export type UpdateUserCompaniesInput = v.InferOutput<
  typeof updateUserCompaniesSchema
>;
export type BlockUserInput = v.InferOutput<typeof blockUserSchema>;
