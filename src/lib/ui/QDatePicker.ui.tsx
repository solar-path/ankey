"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/lib/ui/button";
import { Calendar } from "@/lib/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/lib/ui/popover";
import { cn } from "@/lib/utils";

interface QDatePickerProps {
  id?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function QDatePicker({
  id,
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
}: QDatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={id}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value ? value.toLocaleDateString() : placeholder}
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          captionLayout="dropdown"
          onSelect={(newDate) => {
            onChange?.(newDate);
            if (newDate) {
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
