import { useState, forwardRef } from "react";
import { Input } from "@/lib/ui/input";
import { Button } from "@/lib/ui/button";
import { Progress } from "@/lib/ui/progress";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface QPasswordProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
  showGenerator?: boolean;
  onGeneratedPassword?: (password: string) => void;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  feedback: string[];
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return { score: 0, label: "No password", color: "bg-gray-300", feedback: [] };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (password.length < 8) feedback.push("At least 8 characters required");

  // Lowercase letters
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add lowercase letters");
  }

  // Uppercase letters
  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add uppercase letters");
  }

  // Numbers
  if (/\d/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add numbers");
  }

  // Special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add special characters");
  }

  // No repeated characters
  if (!/(.)\1{2,}/.test(password)) {
    score += 10;
  } else {
    feedback.push("Avoid repeated characters");
  }

  // No common patterns
  const commonPatterns = ["123", "abc", "qwerty", "password", "admin"];
  const lowerPassword = password.toLowerCase();
  const hasCommonPattern = commonPatterns.some((pattern) =>
    lowerPassword.includes(pattern)
  );
  if (!hasCommonPattern) {
    score += 10;
  } else {
    feedback.push("Avoid common patterns");
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Determine label and color
  let label = "";
  let color = "";
  if (score < 30) {
    label = "Weak";
    color = "bg-red-500";
  } else if (score < 60) {
    label = "Fair";
    color = "bg-orange-500";
  } else if (score < 80) {
    label = "Good";
    color = "bg-yellow-500";
  } else {
    label = "Strong";
    color = "bg-green-500";
  }

  return { score, label, color, feedback };
};

const generateStrongPassword = (): string => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const allChars = lowercase + uppercase + numbers + special;

  let password = "";

  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest (total length: 16 characters)
  for (let i = password.length; i < 16; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

export const QPassword = forwardRef<HTMLInputElement, QPasswordProps>(
  ({ className, showStrength = false, showGenerator = false, onGeneratedPassword, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");

    const strength = showStrength ? calculatePasswordStrength(password) : null;

    const handleGeneratePassword = () => {
      const newPassword = generateStrongPassword();
      setPassword(newPassword);
      if (onGeneratedPassword) {
        onGeneratedPassword(newPassword);
      }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={handlePasswordChange}
            className={cn("pr-20", className)}
          />
          <div className="absolute right-0 top-0 h-full flex items-center gap-1 pr-1">
            {showGenerator && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleGeneratePassword}
                title="Generate strong password"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {showStrength && password && strength && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Password strength:</span>
              <span className={cn("text-xs font-medium", {
                "text-red-500": strength.score < 30,
                "text-orange-500": strength.score >= 30 && strength.score < 60,
                "text-yellow-500": strength.score >= 60 && strength.score < 80,
                "text-green-500": strength.score >= 80,
              })}>
                {strength.label}
              </span>
            </div>
            <Progress value={strength.score} className="h-2" indicatorClassName={strength.color} />
            {strength.feedback.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1">
                {strength.feedback.map((item, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <span className="text-orange-500">"</span> {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }
);

QPassword.displayName = "QPassword";
