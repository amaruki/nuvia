import { z } from "zod";

// Base validation schemas shared across all media validation domains
export const uuidSchema = z.string().uuid("Invalid ID format");
export const urlSchema = z.string().url("Invalid URL format");
export const emailSchema = z.string().email("Invalid email format");
export const dateSchema = z.date();
