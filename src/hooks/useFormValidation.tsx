import { useState, useCallback } from "react";

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const useFormValidation = <T extends Record<string, any>>(
  schema: ValidationSchema
) => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback(
    (name: string, value: any): string | null => {
      const rules = schema[name];
      if (!rules) return null;

      if (rules.required && (!value || (typeof value === "string" && !value.trim()))) {
        return "This field is required";
      }

      if (rules.minLength && typeof value === "string" && value.length < rules.minLength) {
        return `Minimum ${rules.minLength} characters required`;
      }

      if (rules.maxLength && typeof value === "string" && value.length > rules.maxLength) {
        return `Maximum ${rules.maxLength} characters allowed`;
      }

      if (rules.pattern && typeof value === "string" && !rules.pattern.test(value)) {
        return "Invalid format";
      }

      if (rules.custom) {
        return rules.custom(value);
      }

      return null;
    },
    [schema]
  );

  const validate = useCallback(
    (data: T): boolean => {
      const newErrors: ValidationErrors = {};
      let isValid = true;

      Object.keys(schema).forEach((key) => {
        const error = validateField(key, data[key]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [schema, validateField]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearError = useCallback((name: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const setError = useCallback((name: string, message: string) => {
    setErrors((prev) => ({ ...prev, [name]: message }));
  }, []);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    clearError,
    setError,
    hasErrors: Object.keys(errors).length > 0,
  };
};
