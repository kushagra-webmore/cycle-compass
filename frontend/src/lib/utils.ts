import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the current date as a YYYY-MM-DD string in the LOCAL timezone.
 * Using toISOString() returns UTC date, often causing "yesterday" errors.
 */
export function getLocalDateString(date = new Date()): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a Date object set to LOCAL midnight.
 * Direct parsing (new Date('YYYY-MM-DD')) defaults to UTC midnight, 
 * which shifts to previous day in Western timezones when formatted.
 */
export function parseLocalYYYYMMDD(dateStr: string): Date {
  if (!dateStr) return new Date();
  // Append T00:00:00 to force local time parsing
  return new Date(`${dateStr}T00:00:00`);
}
