// Live password requirement checks and strength display helpers.

export type PasswordRequirements = {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  score: number;
};

// Password requirements checker
export function checkPasswordRequirements(password: string): PasswordRequirements {
  if (!password) {
    return {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
      score: 0,
    };
  }

  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[^a-zA-Z\d]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  return { ...requirements, score };
}

export function getStrengthText(score: number): string {
  const strengthLevels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  return strengthLevels[Math.min(score - 1, strengthLevels.length - 1)] || "Very Weak";
}

export function getStrengthColor(score: number): string {
  if (score <= 2) return "text-red-500";
  if (score === 3) return "text-yellow-500";
  return "text-green-500";
}

export function getProgressBarColor(score: number): string {
  if (score <= 2) return "bg-red-500";
  if (score === 3) return "bg-yellow-500";
  return "bg-green-500";
}
