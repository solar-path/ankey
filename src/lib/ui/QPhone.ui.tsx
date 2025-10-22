import { useEffect, useState } from "react";
import { Input } from "@/lib/ui/input";
import { Button } from "@/lib/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/ui/popover";
import { countries as countriesAPI, type Country } from "@/modules/shared/database/reference-data";

interface QPhoneProps {
  value?: string;
  onChange?: (value: string) => void;
  onCountryDetected?: (countryCode: string) => void; // Callback when phone code suggests a country
  countryCode?: string; // Country code from residence field (e.g., "US")
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function QPhone({ value = "", onChange, onCountryDetected, countryCode, placeholder, disabled, className }: QPhoneProps) {
  const [phoneCode, setPhoneCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [open, setOpen] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);

  // Load countries from PouchDB
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const allCountries = await countriesAPI.getAll();
        setCountries(allCountries);
      } catch (error) {
        console.error("Failed to load countries:", error);
      }
    };
    loadCountries();
  }, []);

  // Parse initial value
  useEffect(() => {
    if (value) {
      // Try to extract phone code from value
      const match = value.match(/^(\+\d{1,4})\s*(.*)$/);
      if (match) {
        setPhoneCode(match[1]);
        setPhoneNumber(match[2]);
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  // Auto-update phone code when country changes
  useEffect(() => {
    if (countryCode) {
      const country = countries.find(c => c.code === countryCode);
      if (country && country.phoneCode) {
        setPhoneCode(country.phoneCode);
      }
    }
  }, [countryCode]);

  // Format phone number - only allow digits and spaces
  const formatPhoneNumber = (input: string): string => {
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, "");

    // Format with spaces for readability (e.g., "555 123 4567")
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);

    // Emit full phone number with code
    const fullPhone = formatted ? `${phoneCode} ${formatted}` : "";
    onChange?.(fullPhone);
  };

  const handlePhoneCodeChange = (newCode: string) => {
    setPhoneCode(newCode);

    // Emit full phone number with new code
    const fullPhone = phoneNumber ? `${newCode} ${phoneNumber}` : "";
    onChange?.(fullPhone);

    // Try to detect country from phone code
    const detectedCountry = countries.find(c => c.phoneCode === newCode);
    if (detectedCountry) {
      onCountryDetected?.(detectedCountry.code);
    }
  };

  // Get unique phone codes
  const uniquePhoneCodes = Array.from(
    new Set(
      countries
        .filter(c => c.phoneCode)
        .map(c => c.phoneCode)
    )
  ).sort();

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-[140px] justify-between"
          >
            {phoneCode}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search code..." />
            <CommandList>
              <CommandEmpty>No phone code found.</CommandEmpty>
              <CommandGroup>
                {uniquePhoneCodes.map((code) => (
                  <CommandItem
                    key={code}
                    value={code}
                    onSelect={() => {
                      handlePhoneCodeChange(code);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        phoneCode === code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {code}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder || "555 123 4567"}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}
