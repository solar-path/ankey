import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useTranslation } from "react-i18next";
import * as v from "valibot";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/lib/ui/form";
import { Textarea } from "@/lib/ui/textarea";
import { QPhone } from "@/lib/ui/QPhone.ui";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/lib/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/lib/ui/popover";
import { toast } from "sonner";
import {
  countries as countriesAPI,
  type Country,
} from "@/modules/shared/database/reference-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import { useAuth } from "@/lib/auth-context";
import { AuthService } from "@/modules/auth/auth-service";

const contactSchema = v.object({
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  city: v.optional(v.string()),
  state: v.optional(v.string()),
  zipCode: v.optional(v.string()),
  country: v.optional(v.string()),
});

type ContactFormData = v.InferOutput<typeof contactSchema>;

interface ContactFormProps {
  onSuccess?: () => void;
}

export function ContactForm({ onSuccess }: ContactFormProps) {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);

  const form = useForm<ContactFormData>({
    resolver: valibotResolver(contactSchema),
  });

  useEffect(() => {
    // Load countries from PouchDB
    const loadCountries = async () => {
      try {
        const allCountries = await countriesAPI.getAll();
        setCountries(allCountries);
      } catch (error) {
        console.error("Failed to load countries:", error);
      }
    };
    loadCountries();

    // Load contact data from user profile
    if (user?.profile) {
      const phoneValue = (user.profile as any).phone || "";
      setPhone(phoneValue);
      form.setValue("phone", phoneValue);
      form.setValue("address", (user.profile as any).address || "");
      form.setValue("city", (user.profile as any).city || "");
      form.setValue("state", (user.profile as any).state || "");
      form.setValue("zipCode", (user.profile as any).zipCode || "");
      form.setValue("country", (user.profile as any).country || "");
    }
  }, [form, user]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      if (!user?._id) {
        toast.error(t('auth.account.contact.messages.userNotFound'));
        return;
      }

      // Update profile with contact information
      await AuthService.updateProfile(user._id, {
        ...(user.profile || {}),
        ...data,
      } as any);

      // Refresh user data to show updated information
      await refreshUser();

      toast.success(t('auth.account.contact.messages.updated'));
      onSuccess?.();
    } catch (error: any) {
      console.error("Contact update error:", error);
      toast.error(error.message || t('auth.account.contact.messages.updateError'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.account.contact.title')}</CardTitle>
        <CardDescription>{t('auth.account.contact.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.account.contact.phoneLabel')}</FormLabel>
                  <FormControl>
                    <QPhone
                      value={phone}
                      onChange={(value) => {
                        setPhone(value);
                        field.onChange(value);
                      }}
                      onCountryDetected={(countryCode) => {
                        // Suggest country based on phone code if no country is set
                        const currentCountry = form.getValues("country");
                        if (!currentCountry) {
                          form.setValue("country", countryCode);
                        }
                      }}
                      countryCode={form.watch("country")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.account.contact.addressLabel')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={t('auth.account.contact.addressPlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.account.contact.cityLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('auth.account.contact.cityPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.account.contact.stateLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('auth.account.contact.statePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.account.contact.zipCodeLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('auth.account.contact.zipCodePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.account.contact.countryLabel')}</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                          >
                            {field.value
                              ? countries.find((c) => c.code === field.value)
                                  ?.name
                              : t('auth.account.contact.countryPlaceholder')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder={t('auth.account.contact.countrySearch')} />
                          <CommandList>
                            <CommandEmpty>{t('auth.account.contact.noCountry')}</CommandEmpty>
                            <CommandGroup>
                              {countries.map((c) => (
                                <CommandItem
                                  key={c.code}
                                  value={c.name}
                                  onSelect={() => {
                                    field.onChange(c.code);
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === c.code
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {c.name}
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

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t('auth.account.contact.savingButton') : t('auth.account.contact.saveButton')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
