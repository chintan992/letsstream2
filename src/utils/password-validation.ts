export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "good" | "strong";
}

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;

export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  // Compute strength based on character types present (independent of validity)
  const hasSpecial = SPECIAL_CHAR_REGEX.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);

  const score = [hasSpecial, hasNumber, hasUpper, hasLower].filter(
    Boolean
  ).length;

  let strength: "weak" | "fair" | "good" | "strong" = "weak";

  if (password.length >= 12 && score >= 3) {
    strength = "strong";
  } else if (password.length >= 10 && score >= 2) {
    strength = "good";
  } else if (password.length >= 8 && score >= 1) {
    strength = "fair";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

export const getStrengthColor = (
  strength: PasswordValidation["strength"]
): string => {
  switch (strength) {
    case "weak":
      return "bg-red-500";
    case "fair":
      return "bg-orange-500";
    case "good":
      return "bg-yellow-500";
    case "strong":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

export const getStrengthLabel = (
  strength: PasswordValidation["strength"]
): string => {
  switch (strength) {
    case "weak":
      return "Weak";
    case "fair":
      return "Fair";
    case "good":
      return "Good";
    case "strong":
      return "Strong";
    default:
      return "";
  }
};
