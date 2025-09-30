import { z } from 'zod';
import { ValidationError } from '../errors';

/**
 * Validate data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data
 * @throws ValidationError if validation fails
 */
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convert Zod error to our ValidationError format
      const fields = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      throw new ValidationError(fields);
    }
    
    // Re-throw non-Zod errors
    throw error;
  }
}

/**
 * Validate form data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param formData - FormData to validate
 * @returns Validated data
 * @throws ValidationError if validation fails
 */
export function validateFormData<T>(schema: z.ZodSchema<T>, formData: FormData): T {
  // Convert FormData to a plain object
  const data: Record<string, unknown> = {};
  
  // Use a traditional for loop to iterate through FormData entries
  const entries = (formData as any).entries();
  let entry = entries.next();
  while (!entry.done) {
    const [key, value] = entry.value;
    
    // Handle multiple values for the same key (e.g., checkboxes)
    if (data[key] !== undefined) {
      // If we already have a value for this key, convert it to an array
      if (Array.isArray(data[key])) {
        (data[key] as unknown[]).push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
    
    entry = entries.next();
  }
  
  return validateWithSchema(schema, data);
}

/**
 * Validate request body against a Zod schema
 * @param schema - Zod schema to validate against
 * @param body - Request body to validate
 * @returns Validated data
 * @throws ValidationError if validation fails
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return validateWithSchema(schema, body);
}

/**
 * Validate query parameters against a Zod schema
 * @param schema - Zod schema to validate against
 * @param searchParams - URLSearchParams to validate
 * @returns Validated data
 * @throws ValidationError if validation fails
 */
export function validateQueryParams<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  // Convert URLSearchParams to a plain object
  const data: Record<string, unknown> = {};
  
  // Use Array.from to convert the iterator to an array
  Array.from(searchParams.entries()).forEach(([key, value]) => {
    // Handle multiple values for the same key
    if (data[key] !== undefined) {
      // If we already have a value for this key, convert it to an array
      if (Array.isArray(data[key])) {
        (data[key] as unknown[]).push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  });
  
  return validateWithSchema(schema, data);
}

/**
 * Create a validation error from a Zod error
 * @param error - Zod error
 * @returns ValidationError
 */
export function createValidationError(error: z.ZodError): ValidationError {
  const fields = error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
  
  return new ValidationError(fields);
}

/**
 * Format validation errors for API responses
 * @param error - ValidationError
 * @returns Formatted errors object
 */
export function formatValidationErrors(error: ValidationError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  
  error.fields.forEach((field) => {
    if (!errors[field.field]) {
      errors[field.field] = [];
    }
    errors[field.field].push(field.message);
  });
  
  return errors;
}

/**
 * Check if a value is a valid email address
 * @param email - Email address to validate
 * @returns True if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a password meets security requirements
 * @param password - Password to validate
 * @returns True if valid, false otherwise
 */
export function isValidPassword(password: string): boolean {
  // At least 8 characters, with at least one uppercase, one lowercase, one number, and one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Check if a username meets requirements
 * @param username - Username to validate
 * @returns True if valid, false otherwise
 */
export function isValidUsername(username: string): boolean {
  // Only alphanumeric characters and underscores, between 3 and 20 characters
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - Input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  // Replace HTML special characters with their entities
  return input
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

/**
 * Validate and sanitize a string field
 * @param value - Value to validate and sanitize
 * @param fieldName - Name of the field for error messages
 * @param required - Whether the field is required
 * @param maxLength - Maximum allowed length
 * @returns Sanitized value
 * @throws ValidationError if validation fails
 */
export function validateStringField(
  value: unknown,
  fieldName: string,
  required: boolean = true,
  maxLength: number = 255
): string {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new ValidationError([
        { field: fieldName, message: `${fieldName} is required` },
      ]);
    }
    return '';
  }
  
  if (typeof value !== 'string') {
    throw new ValidationError([
      { field: fieldName, message: `${fieldName} must be a string` },
    ]);
  }
  
  if (value.length > maxLength) {
    throw new ValidationError([
      { field: fieldName, message: `${fieldName} must be at most ${maxLength} characters` },
    ]);
  }
  
  return sanitizeInput(value.trim());
}

/**
 * Validate a numeric field
 * @param value - Value to validate
 * @param fieldName - Name of the field for error messages
 * @param required - Whether the field is required
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Validated number
 * @throws ValidationError if validation fails
 */
export function validateNumberField(
  value: unknown,
  fieldName: string,
  required: boolean = true,
  min?: number,
  max?: number
): number {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new ValidationError([
        { field: fieldName, message: `${fieldName} is required` },
      ]);
    }
    return 0;
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new ValidationError([
      { field: fieldName, message: `${fieldName} must be a number` },
    ]);
  }
  
  if (min !== undefined && num < min) {
    throw new ValidationError([
      { field: fieldName, message: `${fieldName} must be at least ${min}` },
    ]);
  }
  
  if (max !== undefined && num > max) {
    throw new ValidationError([
      { field: fieldName, message: `${fieldName} must be at most ${max}` },
    ]);
  }
  
  return num;
}

/**
 * Validate a boolean field
 * @param value - Value to validate
 * @param fieldName - Name of the field for error messages
 * @param defaultValue - Default value if field is not provided
 * @returns Validated boolean
 */
export function validateBooleanField(
  value: unknown,
  fieldName: string,
  defaultValue: boolean = false
): boolean {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
      return true;
    }
    if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
      return false;
    }
  }
  
  if (typeof value === 'number') {
    return value === 1;
  }
  
  throw new ValidationError([
    { field: fieldName, message: `${fieldName} must be a boolean` },
  ]);
}