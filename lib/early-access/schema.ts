/**
 * Early-access submission schema, shared by the client form (UX feedback)
 * and the API route (authoritative validation). No dependencies — the
 * shape is small enough to validate by hand.
 */

export const earlyAccessRoles = ["creator", "supporter"] as const;
export type EarlyAccessRole = (typeof earlyAccessRoles)[number];

export type EarlyAccessSubmission = {
  role: EarlyAccessRole;
  name: string;
  email: string;
  country: string;
  /** Optional creator profile or social link. */
  profileLink?: string;
  /** Optional answer to "What would you use BuyMeATee for?" */
  useCase?: string;
  consent: true;
};

export type ValidationResult =
  | { ok: true; data: EarlyAccessSubmission }
  | { ok: false; errors: Partial<Record<FieldName, string>> };

export type FieldName =
  | "role"
  | "name"
  | "email"
  | "country"
  | "profileLink"
  | "useCase"
  | "consent";

const MAX_SHORT = 200;
const MAX_LONG = 1000;

// Deliberately permissive: catches obvious mistakes without rejecting valid addresses.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateEarlyAccessSubmission(
  input: unknown,
): ValidationResult {
  const errors: Partial<Record<FieldName, string>> = {};
  const record =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};

  const role = cleanString(record.role);
  if (!earlyAccessRoles.includes(role as EarlyAccessRole)) {
    errors.role = "Choose whether you're joining as a creator or a supporter.";
  }

  const name = cleanString(record.name);
  if (!name) {
    errors.name = "Please tell us your name.";
  } else if (name.length > MAX_SHORT) {
    errors.name = `Name must be ${MAX_SHORT} characters or fewer.`;
  }

  const email = cleanString(record.email);
  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (email.length > MAX_SHORT || !EMAIL_PATTERN.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  const country = cleanString(record.country);
  if (!country) {
    errors.country = "Please tell us which country you're in.";
  } else if (country.length > MAX_SHORT) {
    errors.country = `Country must be ${MAX_SHORT} characters or fewer.`;
  }

  const profileLink = cleanString(record.profileLink);
  if (profileLink) {
    if (profileLink.length > MAX_SHORT) {
      errors.profileLink = `Link must be ${MAX_SHORT} characters or fewer.`;
    } else if (!/^https?:\/\/\S+\.\S+/.test(profileLink)) {
      errors.profileLink =
        "Please enter a full link starting with http:// or https://.";
    }
  }

  const useCase = cleanString(record.useCase);
  if (useCase.length > MAX_LONG) {
    errors.useCase = `Please keep this under ${MAX_LONG} characters.`;
  }

  if (record.consent !== true && record.consent !== "true") {
    errors.consent =
      "Please confirm you're happy for us to contact you about early access.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      role: role as EarlyAccessRole,
      name,
      email,
      country,
      ...(profileLink ? { profileLink } : {}),
      ...(useCase ? { useCase } : {}),
      consent: true,
    },
  };
}
