import { ValidationAppError } from "../errors/AppError.js";

export function normalizePhoneE164(phone: string): string {
  const trimmed = phone.trim();
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length > 10 && digits.length <= 15) return `+${digits}`;

  throw new ValidationAppError("Phone number must be in E.164 format or a 10 digit local number.", { phone });
}
