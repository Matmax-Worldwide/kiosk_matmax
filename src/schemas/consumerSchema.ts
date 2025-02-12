import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";
export const consumerSchema = z.object({
    firstName: z.string()
      .min(1, "First name is required")
      .max(50, "First name must be 50 characters or less")
      .regex(/^[a-zA-Z\s-]+$/, "First name can only contain letters, spaces, and hyphens"),
    lastName: z.string()
      .min(1, "Last name is required")
      .max(50, "Last name must be 50 characters or less")
      .regex(/^[a-zA-Z\s-]+$/, "Last name can only contain letters, spaces, and hyphens"),
    email: z.string()
      .email("Invalid email address")
      .max(100, "Email must be 100 characters or less")
      .refine(email => !email.endsWith("@example.com"), {
        message: "Please use a real email address"
      }),
    phoneNumber: z.string()
      .optional()
      .refine((phone) => {
        if (!phone) return true; // Campo opcional
        try {
          return isValidPhoneNumber (phone); // Validación genérica
        } catch {
          return false;
        }
      }, {
        message: "Número de teléfono inválido. Por favor, ingresa un número internacional válido.",
      }),
  });