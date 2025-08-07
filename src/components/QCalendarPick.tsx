import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import InputError from './QInputErrors';

import type { QCalendarPickProps } from '@/shared';

export default function QCalendarPick({
    label,
    value,
    onChange,
    error,
    disabled = false,
    placeholder = 'Select date',
    fromYear = 1900,
    toYear = new Date().getFullYear(),
    className,
}: QCalendarPickProps) {
    const [date, setDate] = useState<Date | undefined>(value);

    // Update date when value changes externally
    useEffect(() => {
        const parsedDate = value;
        setDate(parsedDate);
        // Debug date updates
        console.log('QCalendarPick value updated:', { value, parsedDate });
    }, [value]);

    // Handle date selection
    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        console.log('Date selected:', { selectedDate });
        if (onChange && selectedDate) {
            onChange(selectedDate);
        }
    };

    return (
        <div className={cn('grid gap-2', className)}>
            {label && <label className="text-sm leading-none font-medium">{label}</label>}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn('w-full justify-between font-normal', !date && 'text-muted-foreground')}
                        disabled={disabled}
                    >
                        {date ? format(date, 'PPP') : placeholder}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        captionLayout="dropdown"
                        fromYear={fromYear}
                        toYear={toYear}
                        disabled={(date) => {
                            const today = new Date();
                            const minDate = new Date(fromYear, 0, 1);
                            date.setHours(0, 0, 0, 0);
                            today.setHours(0, 0, 0, 0);
                            return date > today || date < minDate;
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            <input type="hidden" name="dob" value={value ? format(value, 'yyyy-MM-dd') : ''} readOnly />
            {error && <InputError message={error} />}
        </div>
    );
}