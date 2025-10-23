import * as v from "valibot";

/**
 * Company Model - Valibot validation schemas shared between backend and frontend
 *
 * Defines validation for:
 * - Companies (workspace, supplier, customer)
 * - Bank accounts
 * - Contact information
 */

// Contact schema for company contact information
export const contactSchema = v.object({
  address: v.string(),
  phone: v.string(),
  email: v.pipe(v.string(), v.email()),
  city: v.string(),
  state: v.string(),
  zipCode: v.string(),
  country: v.string(),
});

// Bank account schema
export const bankAccountSchema = v.object({
  bankName: v.string(),
  accountNumber: v.string(),
  accountHolderName: v.string(),
  swift: v.optional(v.string()),
  iban: v.optional(v.string()),
  currency: v.optional(v.string()),
  country: v.optional(v.string()),
  isPrimary: v.optional(v.boolean()),
});

// Schema for creating a new company
export const createCompanySchema = v.object({
  type: v.picklist(["workspace", "supplier", "customer"]),
  title: v.pipe(v.string(), v.minLength(1)),
  logo: v.optional(v.string()),
  website: v.optional(v.string()),
  businessId: v.optional(v.string()),
  taxId: v.optional(v.string()),
  residence: v.string(),
  industry: v.string(),
  contact: v.optional(contactSchema),
  bankAccount: v.optional(bankAccountSchema),
});

// Schema for updating a company

// Settings schema for workspace company
export const settingsSchema = v.object({
  country: v.string(),
  currency: v.string(),
  timezone: v.string(),
  language: v.string(),
  twoFactorRequired: v.boolean(),
  twoFactorDeadline: v.nullable(v.string()),
  passwordChangeDays: v.number(),
});

// Schema for updating a company
export const updateCompanySchema = v.object({
  title: v.optional(v.string()),
  logo: v.optional(v.string()),
  website: v.optional(v.string()),
  businessId: v.optional(v.string()),
  taxId: v.optional(v.string()),
  residence: v.optional(v.string()),
  industry: v.optional(v.string()),
  contact: v.optional(contactSchema),
  settings: v.optional(settingsSchema),
});

// Schema for company type filter
export const companyTypeFilterSchema = v.object({
  type: v.optional(v.picklist(["workspace", "supplier", "customer"])),
});

// Schema for creating a bank account
export const createBankAccountSchema = v.object({
  bankName: v.string(),
  accountNumber: v.string(),
  accountHolderName: v.string(),
  swift: v.optional(v.string()),
  iban: v.optional(v.string()),
  currency: v.optional(v.string()),
  country: v.optional(v.string()),
  isPrimary: v.optional(v.boolean()),
});

// Schema for updating a bank account
export const updateBankAccountSchema = v.object({
  bankName: v.optional(v.string()),
  accountNumber: v.optional(v.string()),
  accountHolderName: v.optional(v.string()),
  swift: v.optional(v.string()),
  iban: v.optional(v.string()),
  currency: v.optional(v.string()),
  country: v.optional(v.string()),
  isPrimary: v.optional(v.boolean()),
});

// Type exports for TypeScript inference
export type ContactInput = v.InferOutput<typeof contactSchema>;
export type BankAccountInput = v.InferOutput<typeof bankAccountSchema>;
export type CreateCompanyInput = v.InferOutput<typeof createCompanySchema>;
export type UpdateCompanyInput = v.InferOutput<typeof updateCompanySchema>;
export type CompanyTypeFilter = v.InferOutput<typeof companyTypeFilterSchema>;
export type CreateBankAccountInput = v.InferOutput<
  typeof createBankAccountSchema
>;
export type UpdateBankAccountInput = v.InferOutput<
  typeof updateBankAccountSchema
>;
