import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate avatar initials from a user's name or email.
 * - "Parth Vaghela" → "PV"  (first letter of each word, max 2)
 * - "Parth"         → "PA"  (first 2 letters of single word)
 * - "parth@mail.com" → "PA" (first 2 letters of email prefix)
 */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      // Multi-word: take first letter of each word (max 2)
      return parts.slice(0, 2).map(p => p[0]).join("").toUpperCase();
    } else {
      // Single word: take first 2 letters
      return parts[0].slice(0, 2).toUpperCase();
    }
  }
  if (email) {
    // Use email prefix, first 2 chars
    return email.split("@")[0].slice(0, 2).toUpperCase();
  }
  return "DY";
}
