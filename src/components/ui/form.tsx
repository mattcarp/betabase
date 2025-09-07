/**
 * MAC Design System Form Components
 * Professional form handling with react-hook-form integration
 * FUCKING BEAUTIFUL FORMS WITH PROPER VALIDATION!
 */

"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { AlertCircle, CheckCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "./label";

/**
 * Form Provider - wraps react-hook-form's FormProvider
 */
const Form = FormProvider;

/**
 * Type definitions for form field context
 */
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

/**
 * FormField Component - handles field registration
 */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

/**
 * Hook to access form field state
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

/**
 * FormItem Component - container for form field
 * MAC styled with proper spacing and animations
 */
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /** Variant for different form item styles */
    variant?: "default" | "floating" | "inline";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const id = React.useId();

  const variantClasses = {
    default: "space-y-2",
    floating: "relative",
    inline: "flex items-center gap-4",
  };

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        ref={ref}
        className={cn(
          "mac-form-field", // MAC Design System form field
          variantClasses[variant],
          "transition-all duration-200", // MAC standard transition
          className,
        )}
        {...props}
      />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

/**
 * FormLabel Component - MAC styled label
 */
const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    required?: boolean;
  }
>(({ className, required, children, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(
        "mac-label", // MAC Design System label
        "text-sm font-light text-[var(--mac-text-primary)]",
        "transition-colors duration-200",
        error && "text-red-500",
        className,
      )}
      htmlFor={formItemId}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-red-500" aria-label="required">
          *
        </span>
      )}
    </Label>
  );
});
FormLabel.displayName = "FormLabel";

/**
 * FormControl Component - wrapper for form inputs
 * Adds proper ARIA attributes automatically
 */
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? formDescriptionId
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      aria-required={props["aria-required"]}
      data-state={error ? "error" : "valid"}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

/**
 * FormDescription Component - helper text
 * MAC styled with proper colors
 */
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn(
        "mac-form-description", // MAC Design System form description
        "text-xs text-[var(--mac-text-muted)]",
        "mt-1.5 font-light",
        "transition-opacity duration-200",
        className,
      )}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

/**
 * FormMessage Component - error/success messages
 * MAC styled with icons and animations
 */
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    /** Type of message */
    type?: "error" | "success" | "warning";
  }
>(({ className, children, type = "error", ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : children;

  if (!body) {
    return null;
  }

  const typeConfig = {
    error: {
      icon: AlertCircle,
      className: "text-red-500",
    },
    success: {
      icon: CheckCircle,
      className: "text-green-500",
    },
    warning: {
      icon: AlertCircle,
      className: "text-yellow-500",
    },
  };

  const Icon = typeConfig[type].icon;

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn(
        "mac-form-message", // MAC Design System form message
        "text-xs font-medium flex items-center gap-1.5 mt-1.5",
        typeConfig[type].className,
        "transition-all duration-200",
        className,
      )}
      role={type === "error" ? "alert" : "status"}
      aria-live="polite"
      {...props}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{body}</span>
    </p>
  );
});
FormMessage.displayName = "FormMessage";

/**
 * Additional MAC Form Components
 */

/**
 * FormFieldset Component - groups related form fields
 */
const FormFieldset = React.forwardRef<
  HTMLFieldSetElement,
  React.FieldsetHTMLAttributes<HTMLFieldSetElement>
>(({ className, ...props }, ref) => {
  return (
    <fieldset
      ref={ref}
      className={cn(
        "mac-glass p-6 rounded-lg border border-mac-utility-border",
        "space-y-4",
        className,
      )}
      {...props}
    />
  );
});
FormFieldset.displayName = "FormFieldset";

/**
 * FormLegend Component - fieldset legend
 */
const FormLegend = React.forwardRef<
  HTMLLegendElement,
  React.HTMLAttributes<HTMLLegendElement>
>(({ className, ...props }, ref) => {
  return (
    <legend
      ref={ref}
      className={cn(
        "text-lg font-light text-mac-text-primary",
        "px-2 -ml-2",
        className,
      )}
      {...props}
    />
  );
});
FormLegend.displayName = "FormLegend";

// Export all components and utilities
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  FormFieldset,
  FormLegend,
};

// Type exports
export type { FormFieldContextValue, FormItemContextValue };