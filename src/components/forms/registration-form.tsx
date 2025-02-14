"use client";
import React from "react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { consumerSchema } from "@/schemas/consumerSchema"; // Importa el esquema desde un archivo centralizado
import { PhoneInput } from "@/components/phone-input";
interface RegistrationFormProps {
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function RegistrationForm({
  onSubmit,
  isSubmitting = false,
}: RegistrationFormProps) {
  const { language } = useLanguageContext();

  // Form hook setup con `zodResolver` y valores por defecto
  const form = useForm<z.infer<typeof consumerSchema>>({
    resolver: zodResolver(consumerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    },
  });

  // Manejo de envío de formulario
  const handleSubmit = async (data: z.infer<typeof consumerSchema>) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
      form.setError("root", {
        message:
          language === "en"
            ? "An error occurred. Please try again."
            : "Ocurrió un error. Por favor intente de nuevo.",
      });
    }
  };

  return (
    <Form  {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* First Name */}
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-2xl font-semibold">
                {language === "en" ? "First Name" : "Nombre"}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="w-full h-16 p-4 text-2xl border-2 rounded-lg text-2xl"
                  placeholder={
                    language === "en"
                      ? "Enter first name"
                      : "Ingrese su nombre"
                  }
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last Name */}
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-2xl font-semibold">
                {language === "en" ? "Last Name" : "Apellido"}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="w-full h-16 p-4 text-2xl border-2 rounded-lg text-2xl"
                  placeholder={
                    language === "en"
                      ? "Enter last name"
                      : "Ingrese su apellido"
                  }
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-2xl font-semibold">
                {language === "en" ? "Email" : "Correo Electrónico"}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  className="w-full h-16 p-4 text-2xl border-2 rounded-lg text-2xl"
                  placeholder={
                    language === "en" ? "Enter your email" : "Ingrese su correo"
                  }
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone Number */}
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-2xl font-semibold">
                {language === "en" ? "Phone Number" : "Número de Teléfono"}
              </FormLabel>
              <FormControl>
                <PhoneInput
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={!!form.formState.errors.phoneNumber}
                  placeholder={
                    language === "en"
                      ? "Enter phone number" 
                      : "Ingrese número de teléfono"
                  }
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Error Global */}
        {form.formState.errors.root && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm text-center">
              {form.formState.errors.root.message}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full py-6 text-xl font-medium mt-8 rounded-xl hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-green-600 to-teal-600 text-white"
          variant="default"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? language === "en"
              ? "Creating Account..."
              : "Creando Cuenta..."
            : language === "en"
            ? "Create Account"
            : "Crear Cuenta"}
        </Button>
      </form>
    </Form>
  );
}
