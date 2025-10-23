/**
 * Company Settings Page
 * Comprehensive settings for workspace companies including:
 * - Regional settings (country, timezone, language, formats)
 * - Financial settings (fiscal year, currencies)
 * - Tax settings (default rates, labels)
 * - Security settings (2FA, password policies)
 */

import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { settingsSchema, type UpdateCompanyInput } from "./company.valibot";
import { CompanyService } from "./company-service";
import { useCompany } from "@/lib/company-context";
import { toast } from "sonner";
import { Button } from "@/lib/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/lib/ui/form";
import { Input } from "@/lib/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/ui/select";
import { Switch } from "@/lib/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { Separator } from "@/lib/ui/separator";
import { useState, useEffect } from "react";
import { Badge } from "@/lib/ui/badge";
import { X } from "lucide-react";
import { countries } from "@/modules/shared/database/reference-data";
import type { Country } from "@/modules/shared/database/reference-data";

// Common currencies
const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
];

// Default fallback timezones if country data not available
const DEFAULT_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Australia/Sydney",
];

// Languages
const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ru", name: "Русский" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "ar", name: "العربية" },
];

// Date formats
const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2025)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2025)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2025-12-31)" },
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY (31.12.2025)" },
];

// Number formats
const NUMBER_FORMATS = [
  { value: "1,234.56", label: "1,234.56 (comma thousands, dot decimal)" },
  { value: "1.234,56", label: "1.234,56 (dot thousands, comma decimal)" },
  { value: "1 234.56", label: "1 234.56 (space thousands, dot decimal)" },
  { value: "1 234,56", label: "1 234,56 (space thousands, comma decimal)" },
];

// Fiscal year presets
const FISCAL_YEAR_PRESETS = [
  { name: "Calendar Year", start: "01-01", end: "12-31" },
  { name: "UK Tax Year", start: "04-06", end: "04-05" },
  { name: "US Federal", start: "10-01", end: "09-30" },
  { name: "Australia", start: "07-01", end: "06-30" },
  { name: "India", start: "04-01", end: "03-31" },
];

export default function CompanySettingsPage() {
  const { activeCompany, refreshCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [additionalCurrency, setAdditionalCurrency] = useState("");
  const [residenceCountry, setResidenceCountry] = useState<Country | null>(null);
  const [availableTimezones, setAvailableTimezones] = useState<string[]>(DEFAULT_TIMEZONES);

  // Initialize form with current settings or defaults
  const form = useForm({
    resolver: valibotResolver(settingsSchema),
    defaultValues: {
      // Regional
      country: activeCompany?.residence || "",
      timezone: activeCompany?.settings?.timezone || "UTC",
      language: activeCompany?.settings?.language || "en",
      dateFormat: activeCompany?.settings?.dateFormat || "DD/MM/YYYY",
      numberFormat: activeCompany?.settings?.numberFormat || "1,234.56",

      // Financial
      fiscalYearStart: activeCompany?.settings?.fiscalYearStart || "01-01",
      fiscalYearEnd: activeCompany?.settings?.fiscalYearEnd || "12-31",
      workingCurrency: activeCompany?.settings?.workingCurrency || "USD",
      reportingCurrency: activeCompany?.settings?.reportingCurrency || "USD",
      additionalCurrencies: activeCompany?.settings?.additionalCurrencies || [],

      // Tax
      defaultTaxRate: activeCompany?.settings?.defaultTaxRate || 0,
      taxIdLabel: activeCompany?.settings?.taxIdLabel || "VAT",

      // Security
      twoFactorRequired: activeCompany?.settings?.twoFactorRequired || false,
      twoFactorDeadline: activeCompany?.settings?.twoFactorDeadline || null,
      passwordChangeDays: activeCompany?.settings?.passwordChangeDays || 90,
    },
  });

  // Load residence country data on mount or when activeCompany changes
  useEffect(() => {
    const loadCountryData = async () => {
      if (activeCompany?.residence) {
        try {
          const country = await countries.getByCode(activeCompany.residence);
          setResidenceCountry(country);

          // Extract timezones from country data
          if (country.timezones && country.timezones.length > 0) {
            const timezoneNames = country.timezones.map(tz => tz.name);
            setAvailableTimezones(timezoneNames);
          } else {
            setAvailableTimezones(DEFAULT_TIMEZONES);
          }
        } catch (error) {
          console.error("Failed to load country data:", error);
          setAvailableTimezones(DEFAULT_TIMEZONES);
        }
      }
    };

    loadCountryData();
  }, [activeCompany?.residence]);

  // Update form when company changes or residence country is loaded
  useEffect(() => {
    if (activeCompany) {
      // Use country data to pre-fill defaults if settings don't exist
      const defaultTimezone = residenceCountry?.timezones[0]?.name || "UTC";
      const defaultLanguage = residenceCountry?.language || "en";
      const defaultCurrency = residenceCountry?.currency || "USD";

      form.reset({
        country: activeCompany.residence || "",
        timezone: activeCompany.settings?.timezone || defaultTimezone,
        language: activeCompany.settings?.language || defaultLanguage,
        dateFormat: activeCompany.settings?.dateFormat || "DD/MM/YYYY",
        numberFormat: activeCompany.settings?.numberFormat || "1,234.56",
        fiscalYearStart: activeCompany.settings?.fiscalYearStart || "01-01",
        fiscalYearEnd: activeCompany.settings?.fiscalYearEnd || "12-31",
        workingCurrency: activeCompany.settings?.workingCurrency || defaultCurrency,
        reportingCurrency: activeCompany.settings?.reportingCurrency || defaultCurrency,
        additionalCurrencies: activeCompany.settings?.additionalCurrencies || [],
        defaultTaxRate: activeCompany.settings?.defaultTaxRate || 0,
        taxIdLabel: activeCompany.settings?.taxIdLabel || "VAT",
        twoFactorRequired: activeCompany.settings?.twoFactorRequired || false,
        twoFactorDeadline: activeCompany.settings?.twoFactorDeadline || null,
        passwordChangeDays: activeCompany.settings?.passwordChangeDays || 90,
      });
    }
  }, [activeCompany, residenceCountry, form]);

  const onSubmit = async (data: any) => {
    if (!activeCompany) {
      toast.error("No active company selected");
      return;
    }

    setIsLoading(true);
    try {
      const updateData: UpdateCompanyInput = {
        settings: data,
      };

      await CompanyService.updateCompany(activeCompany._id, updateData);
      await refreshCompany();
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  const addAdditionalCurrency = () => {
    if (!additionalCurrency) return;

    const current = form.getValues("additionalCurrencies") || [];
    if (current.includes(additionalCurrency)) {
      toast.error("Currency already added");
      return;
    }

    form.setValue("additionalCurrencies", [...current, additionalCurrency]);
    setAdditionalCurrency("");
  };

  const removeAdditionalCurrency = (currency: string) => {
    const current = form.getValues("additionalCurrencies") || [];
    form.setValue(
      "additionalCurrencies",
      current.filter((c) => c !== currency)
    );
  };

  const applyFiscalYearPreset = (preset: typeof FISCAL_YEAR_PRESETS[0]) => {
    form.setValue("fiscalYearStart", preset.start);
    form.setValue("fiscalYearEnd", preset.end);
    toast.success(`Applied ${preset.name} fiscal year`);
  };

  const applyCountryDefaults = () => {
    if (!residenceCountry) {
      toast.error("No residence country data available");
      return;
    }

    // Apply country defaults
    if (residenceCountry.timezones[0]?.name) {
      form.setValue("timezone", residenceCountry.timezones[0].name);
    }
    if (residenceCountry.language) {
      form.setValue("language", residenceCountry.language);
    }
    if (residenceCountry.currency) {
      form.setValue("workingCurrency", residenceCountry.currency);
      form.setValue("reportingCurrency", residenceCountry.currency);
    }

    toast.success(`Applied defaults from ${residenceCountry.name}`);
  };

  if (!activeCompany) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">No company selected</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Company Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure regional, financial, and security settings for {activeCompany.title}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Regional Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>
                Configure location, timezone, language, and format preferences
              </CardDescription>
              {residenceCountry && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyCountryDefaults}
                  >
                    Apply defaults from {residenceCountry.name}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="United States"
                        {...field}
                        value={residenceCountry?.name || field.value}
                        disabled
                      />
                    </FormControl>
                    <FormDescription>
                      Primary country of operation (set from company residence)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTimezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Company timezone for timestamps
                      {residenceCountry && availableTimezones.length > 1 &&
                        ` (${availableTimezones.length} zones available for ${residenceCountry.name})`
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Default interface language</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Format</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DATE_FORMATS.map((fmt) => (
                            <SelectItem key={fmt.value} value={fmt.value}>
                              {fmt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number Format</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NUMBER_FORMATS.map((fmt) => (
                            <SelectItem key={fmt.value} value={fmt.value}>
                              {fmt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Settings</CardTitle>
              <CardDescription>
                Configure fiscal year and currency settings for financial operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fiscal Year */}
              <div>
                <FormLabel>Fiscal Year</FormLabel>
                <p className="text-sm text-muted-foreground mb-3">
                  Define your company's fiscal year period
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {FISCAL_YEAR_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyFiscalYearPreset(preset)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fiscalYearStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date (MM-DD)</FormLabel>
                        <FormControl>
                          <Input placeholder="01-01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fiscalYearEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (MM-DD)</FormLabel>
                        <FormControl>
                          <Input placeholder="12-31" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Currencies */}
              <div className="space-y-4">
                <div>
                  <FormLabel>Working Currency</FormLabel>
                  <p className="text-sm text-muted-foreground mb-2">
                    Primary currency for daily operations
                  </p>
                  <FormField
                    control={form.control}
                    name="workingCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((curr) => (
                              <SelectItem key={curr.code} value={curr.code}>
                                {curr.symbol} {curr.code} - {curr.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormLabel>Reporting Currency</FormLabel>
                  <p className="text-sm text-muted-foreground mb-2">
                    Currency for financial reporting and statements
                  </p>
                  <FormField
                    control={form.control}
                    name="reportingCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((curr) => (
                              <SelectItem key={curr.code} value={curr.code}>
                                {curr.symbol} {curr.code} - {curr.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormLabel>Additional Currencies</FormLabel>
                  <p className="text-sm text-muted-foreground mb-2">
                    Other currencies used in operations (for multi-currency support)
                  </p>
                  <div className="flex gap-2 mb-2">
                    <Select
                      value={additionalCurrency}
                      onValueChange={setAdditionalCurrency}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select currency to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.code} - {curr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={addAdditionalCurrency}
                      disabled={!additionalCurrency}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(form.watch("additionalCurrencies") || []).map((currency) => (
                      <Badge key={currency} variant="secondary" className="gap-1">
                        {currency}
                        <button
                          type="button"
                          onClick={() => removeAdditionalCurrency(currency)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure default tax rates and labels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="defaultTaxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="20"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Default VAT/GST/Tax rate percentage (e.g., 20 for 20%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxIdLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ID Label</FormLabel>
                    <FormControl>
                      <Input placeholder="VAT, GST, Tax ID" {...field} />
                    </FormControl>
                    <FormDescription>
                      How to label tax identification (VAT, GST, Tax ID, etc.)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure authentication and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="twoFactorRequired"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Require Two-Factor Authentication
                      </FormLabel>
                      <FormDescription>
                        Force all team members to enable 2FA
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("twoFactorRequired") && (
                <FormField
                  control={form.control}
                  name="twoFactorDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>2FA Enforcement Deadline</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Date by which all users must enable 2FA (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="passwordChangeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password Change Period (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 90)}
                      />
                    </FormControl>
                    <FormDescription>
                      Require password change every X days (0 to disable)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
