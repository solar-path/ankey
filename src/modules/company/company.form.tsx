import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/lib/ui/dialog";
import { Checkbox } from "@/lib/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/lib/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/lib/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/lib/ui/form";
import countries from "@/../scripts/data/country.json";
import industries from "@/../scripts/data/industry.json";
import { Trash2, Plus, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { QPhone } from "@/lib/ui/QPhone.ui";
import { cn } from "@/lib/utils";
import { useCompanyOptional } from "@/lib/company-context";
import { useAuth } from "@/lib/auth-context";
import { CompanyService } from "./company-service";
import {
  createCompanySchema,
  type CreateCompanyInput,
} from "./company.valibot";

// Use centralized schemas from company.valibot.ts
type CompanyFormData = CreateCompanyInput;

interface CompanyFormProps {
  companyId?: string;
  companyType: "workspace" | "supplier" | "customer";
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CompanyForm({
  companyId,
  companyType,
  onSuccess,
  onCancel,
}: CompanyFormProps) {
  const { user } = useAuth();
  const companyContext = useCompanyOptional();
  const form = useForm<CompanyFormData>({
    resolver: valibotResolver(createCompanySchema),
    defaultValues: {
      type: companyType,
      title: "",
      logo: "",
      website: "",
      businessId: "",
      taxId: "",
      residence: "",
      industry: "",
      contact: {
        email: user?.email || "", // Prepopulate with current user's email
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
    },
  });

  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [urlProtocol, setUrlProtocol] = useState<"http://" | "https://">(
    "https://"
  );

  // Command states for Country and Industry
  const [countryOpen, setCountryOpen] = useState(false);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [contactCountryOpen, setContactCountryOpen] = useState(false);

  useEffect(() => {
    if (companyId) {
      setLoading(true);
      // For editing existing company - load data from PouchDB
      CompanyService.getCompanyById(companyId)
        .then((companyData: any) => {
          form.setValue("type", companyData.type);
          form.setValue("title", companyData.title);

          // Parse website URL and extract protocol
          if (companyData.website) {
            if (companyData.website.startsWith("https://")) {
              setUrlProtocol("https://");
              form.setValue("website", companyData.website);
            } else if (companyData.website.startsWith("http://")) {
              setUrlProtocol("http://");
              form.setValue("website", companyData.website);
            } else {
              form.setValue("website", companyData.website);
            }
          }

          form.setValue("businessId", companyData.businessId || "");
          form.setValue("taxId", companyData.taxId || "");
          form.setValue("residence", companyData.residence || "");
          form.setValue("industry", companyData.industry || "");

          // Set logo preview for existing companies
          if (companyData.logo) {
            form.setValue("logo", companyData.logo);
            setLogoPreview(companyData.logo);
          }

          if (companyData.contact) {
            form.setValue("contact.email", companyData.contact.email || "");
            form.setValue("contact.phone", companyData.contact.phone || "");
            form.setValue("contact.address", companyData.contact.address || "");
            form.setValue("contact.city", companyData.contact.city || "");
            form.setValue("contact.state", companyData.contact.state || "");
            form.setValue("contact.zipCode", companyData.contact.zipCode || "");
            form.setValue("contact.country", companyData.contact.country || "");
          }
        })
        .catch((err: any) => {
          console.error("Failed to fetch company:", err);
          toast.error("Failed to load company data");
        })
        .finally(() => setLoading(false));
    }
  }, [companyId, form]);

  const onSubmit: SubmitHandler<CompanyFormData> = async (data) => {
    console.log("Form submitted with data:", data);
    setLoading(true);
    try {
      // Clean up empty strings to undefined for optional fields
      const cleanData: any = {
        ...data,
        logo: data.logo?.trim() || undefined,
        website: data.website?.trim() || undefined,
        businessId: data.businessId?.trim() || undefined,
        taxId: data.taxId?.trim() || undefined,
      };

      // Clean up contact object - only include if ALL required fields are filled
      if (data.contact) {
        const { address, phone, email, city, state, zipCode, country } =
          data.contact;
        const allFieldsFilled =
          address?.trim() &&
          phone?.trim() &&
          email?.trim() &&
          city?.trim() &&
          state?.trim() &&
          zipCode?.trim() &&
          country?.trim();

        if (!allFieldsFilled) {
          // If not all fields are filled, exclude contact entirely
          cleanData.contact = undefined;
        }
      }

      if (companyId) {
        console.log("Updating company:", companyId);
        const result = await CompanyService.updateCompany(companyId, cleanData);

        console.log("Update response:", result);
        toast.success("Company updated successfully!");
      } else {
        console.log("Creating company with payload:", cleanData);

        if (!user?._id) {
          toast.error("User not authenticated");
          return;
        }

        const result = await CompanyService.createCompany(user._id, cleanData);
        console.log("Create response:", result);

        // Reload companies and set new company as active BEFORE showing success
        if (companyContext?.reloadCompanies && result) {
          console.log(
            "[CompanyForm] Calling reloadCompanies with new company ID:",
            result._id
          );
          // Pass the new company ID to automatically set it as active
          await companyContext.reloadCompanies(result._id);
          console.log("[CompanyForm] reloadCompanies completed");
        }

        // Show success toast and trigger callback after context is updated
        toast.success("Company created successfully!");

        // Longer delay to ensure React re-renders before navigation
        console.log("[CompanyForm] Waiting 300ms before navigation...");
        await new Promise((resolve) => setTimeout(resolve, 300));
        console.log("[CompanyForm] Calling onSuccess callback");
      }
      onSuccess?.();
    } catch (err: any) {
      console.error("Failed to save:", err);
      toast.error("Failed to save company");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        form.setValue("logo", result);
        setLogoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Bank accounts functionality removed for simplicity
  // Will be added in future versions if needed

  const typeLabels = {
    workspace: "Workspace Company",
    supplier: "Supplier",
    customer: "Customer",
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {companyId
              ? `Edit ${typeLabels[companyType]}`
              : `Create ${typeLabels[companyType]}`}
          </CardTitle>
          <CardDescription>
            {companyId
              ? "Update company information"
              : "Enter company details below"}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Company Name */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company Logo */}
              <FormField
                control={form.control}
                name="logo"
                render={() => (
                  <FormItem>
                    <FormLabel>Company Logo</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="cursor-pointer"
                      />
                    </FormControl>
                    {logoPreview && (
                      <div className="mt-3 flex items-center gap-3">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-16 w-16 object-contain border rounded"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.setValue("logo", "");
                            setLogoPreview("");
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Choose file No file selected
                    </p>
                  </FormItem>
                )}
              />

              {/* Website & Business ID */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Select
                            value={urlProtocol}
                            onValueChange={(v: any) => {
                              setUrlProtocol(v);
                              const currentValue = field.value || "";
                              const cleanValue = currentValue.replace(
                                /^https?:\/\//,
                                ""
                              );
                              if (cleanValue) {
                                field.onChange(`${v}${cleanValue}`);
                              }
                            }}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="https://">https://</SelectItem>
                              <SelectItem value="http://">http://</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="example.com"
                            className="flex-1"
                            onChange={(e) => {
                              const value = e.target.value;
                              // Remove any protocol if user pastes full URL
                              const cleanValue = value.replace(
                                /^https?:\/\//,
                                ""
                              );
                              field.onChange(
                                cleanValue ? `${urlProtocol}${cleanValue}` : ""
                              );
                            }}
                            value={
                              field.value?.replace(/^https?:\/\//, "") || ""
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business ID *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tax ID & Country of Residence */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="residence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Residence *</FormLabel>
                      <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={countryOpen}
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? countries.find((c) => c.code === field.value)
                                    ?.name
                                : "Select country"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search country..." />
                            <CommandList>
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup>
                                {countries.map((country) => (
                                  <CommandItem
                                    key={country.code}
                                    value={country.name}
                                    onSelect={() => {
                                      field.onChange(country.code);
                                      form.setValue(
                                        "contact.country",
                                        country.code
                                      );
                                      setCountryOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === country.code
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {country.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Industry */}
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry (GICS) *</FormLabel>
                    <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={industryOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? industries.find(
                                  (i: any) => i.code.toString() === field.value
                                )?.title
                              : "Select industry"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search industry..." />
                          <CommandList>
                            <CommandEmpty>No industry found.</CommandEmpty>
                            <CommandGroup>
                              {industries.map((industry: any) => (
                                <CommandItem
                                  key={industry.code}
                                  value={industry.title}
                                  onSelect={() => {
                                    field.onChange(industry.code.toString());
                                    setIndustryOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === industry.code.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {industry.title}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Information */}
              <div className="pt-4">
                <h3 className="text-lg font-semibold mb-4">
                  Contact Information
                </h3>

                <div className="space-y-4">
                  {/* Email & Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="company@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <QPhone
                              value={field.value || ""}
                              onChange={field.onChange}
                              countryCode={form.watch("residence") || "US"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="contact.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* City & State/Province */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Zip/Postal Code & Country */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact.zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip/Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Popover
                            open={contactCountryOpen}
                            onOpenChange={setContactCountryOpen}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? countries.find(
                                        (c) => c.code === field.value
                                      )?.name
                                    : "Select country"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[400px] p-0"
                              align="start"
                            >
                              <Command>
                                <CommandInput placeholder="Search country..." />
                                <CommandList>
                                  <CommandEmpty>No country found.</CommandEmpty>
                                  <CommandGroup>
                                    {countries.map((country) => (
                                      <CommandItem
                                        key={`contact-${country.code}`}
                                        value={country.name}
                                        onSelect={() => {
                                          field.onChange(country.code);
                                          form.setValue(
                                            "residence",
                                            country.code
                                          );
                                          setContactCountryOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === country.code
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {country.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : companyId ? "Update" : "Create"}
                </Button>
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>
    </>
  );
}

