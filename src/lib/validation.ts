/**
 * Validation and sanitization utilities for safe forms
 */

/**
 * Sanitizes input text by removing HTML tags, potential script injections,
 * event handlers, and javascript: protocols, then trimming and truncating to a safe length.
 */
export function sanitizeInput(val: string, maxLength: number = 255): string {
  if (typeof val !== "string") return "";
  
  // Strip HTML tags and script-like tokens
  let cleaned = val
    .replace(/<[^>]*>/g, "")             // Remove HTML tags
    .replace(/javascript:/gi, "")        // Remove javascript: prefix
    .replace(/on\w+\s*=\s*["']?[^"'>]*["']?/gi, "") // Remove inline event handlers (e.g. onclick=)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ""); // Remove full script tags

  // Trim and enforce maximum length
  return cleaned.trim().slice(0, maxLength);
}

/**
 * Validates Brazilian CPF mathematically.
 */
export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");
  
  if (cleanCPF.length !== 11) return false;
  
  // Reject sequences of identical digits
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let sum = 0;
  let remainder;
  
  // Calculate first verifier digit
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  // Calculate second verifier digit
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
}

/**
 * Automatically masks and formats Brazilian phone numbers as (XX) XXXXX-XXXX or (XX) XXXX-XXXX.
 */
export function formatPhone(val: string): string {
  const cleaned = val.replace(/\D/g, "").slice(0, 11);
  if (cleaned.length === 0) return "";
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}

/**
 * Validates Brazilian phone number length (must be 10 or 11 digits).
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

/**
 * Validates email format strictly.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 100;
}
