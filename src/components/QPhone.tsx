import { Input } from '@/components/ui/input';
import { forwardRef, useEffect, useRef, useState } from 'react';

import { QPhoneProps } from '@/shared';

export const QPhone = forwardRef<HTMLInputElement, QPhoneProps>(
    ({ value = '', onChange, placeholder = '+1 (123) 456 7890', className = '', id = 'phone', ...props }, ref) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const [formattedValue, setFormattedValue] = useState('');

        // Format the phone number
        const formatPhone = (value: string): string => {
            const digits = value.replace(/\D/g, '').slice(0, 11);

            let formatted = '';
            if (digits.length > 0) formatted += `+${digits[0]}`;
            if (digits.length > 1) formatted += ` (${digits.slice(1, 4)}`;
            if (digits.length >= 4) formatted += `) ${digits.slice(4, 7)}`;
            if (digits.length >= 7) formatted += ` ${digits.slice(7, 11)}`;

            return formatted;
        };

        // Handle input changes
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const cursorPosition = e.target.selectionStart || 0;
            const oldValue = formattedValue;
            const newRawValue = e.target.value.replace(/\D/g, '');
            const newFormattedValue = formatPhone(newRawValue);

            setFormattedValue(newFormattedValue);
            onChange(newRawValue);

            // Maintain cursor position
            requestAnimationFrame(() => {
                if (!inputRef.current) return;

                if (e.target.value.length < oldValue.length) {
                    const deletedChar = oldValue[cursorPosition - 1];
                    if (deletedChar && /[^\d]/.test(deletedChar)) {
                        const newPosition = Math.max(0, cursorPosition - 1);
                        inputRef.current.selectionStart = newPosition;
                        inputRef.current.selectionEnd = newPosition;
                        return;
                    }
                }

                const newPosition = cursorPosition + (newFormattedValue.length - oldValue.length);
                inputRef.current.selectionStart = newPosition;
                inputRef.current.selectionEnd = newPosition;
            });
        };

        // Sync with external value changes
        useEffect(() => {
            if (value !== undefined) {
                setFormattedValue(formatPhone(value));
            }
        }, [value]);

        return (
            <Input
                ref={(node) => {
                    if (typeof ref === 'function') {
                        ref(node);
                    } else if (ref) {
                        ref.current = node;
                    }
                    inputRef.current = node;
                }}
                id={id}
                type="tel"
                value={formattedValue}
                onChange={handleChange}
                placeholder={placeholder}
                className={className}
                maxLength={17}
                autoComplete="tel"
                {...props}
            />
        );
    },
);

QPhone.displayName = 'QPhone';