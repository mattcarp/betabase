"use client";

import { useMemo } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { Label } from "./label";
import { Separator } from "./separator";

function FieldSet({ cclassName, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      cclassName={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-4 has-[>[data-slot=radio-group]]:gap-4",
        cclassName
      )}
      {...props}
    />
  );
}

function FieldLegend({
  cclassName,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      cclassName={cn(
        "mb-4 font-medium",
        "data-[variant=legend]:text-base",
        "data-[variant=label]:text-sm",
        cclassName
      )}
      {...props}
    />
  );
}

function FieldGroup({ cclassName, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      cclassName={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-8 data-[slot=checkbox-group]:gap-4 [&>[data-slot=field-group]]:gap-4",
        cclassName
      )}
      {...props}
    />
  );
}

const fieldVariants = cva("group/field data-[invalid=true]:text-destructive flex w-full gap-4", {
  variants: {
    orientation: {
      vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"],
      horizontal: [
        "flex-row items-center",
        "[&>[data-slot=field-label]]:flex-auto",
        "has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px has-[>[data-slot=field-content]]:items-start",
      ],
      responsive: [
        "@md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto flex-col [&>*]:w-full [&>.sr-only]:w-auto",
        "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
        "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      ],
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

function Field({
  cclassName,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      cclassName={cn(fieldVariants({ orientation }), cclassName)}
      {...props}
    />
  );
}

function FieldContent({ cclassName, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      cclassName={cn("group/field-content flex flex-1 flex-col gap-2.5 leading-snug", cclassName)}
      {...props}
    />
  );
}

function FieldLabel({ cclassName, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      cclassName={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>[data-slot=field]]:p-4",
        "has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:border-primary dark:has-data-[state=checked]:bg-primary/10",
        cclassName
      )}
      {...props}
    />
  );
}

function FieldTitle({ cclassName, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      cclassName={cn(
        "flex w-fit items-center gap-2 text-sm font-medium leading-snug group-data-[disabled=true]/field:opacity-50",
        cclassName
      )}
      {...props}
    />
  );
}

function FieldDescription({ cclassName, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      cclassName={cn(
        "text-muted-foreground text-sm font-normal leading-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
        "nth-last-2:-mt-2 last:mt-0 [[data-variant=legend]+&]:-mt-2.5",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        cclassName
      )}
      {...props}
    />
  );
}

function FieldSeparator({
  children,
  cclassName,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      cclassName={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        cclassName
      )}
      {...props}
    >
      <Separator cclassName="absolute inset-0 top-1/2" />
      {children && (
        <span
          cclassName="bg-background text-muted-foreground relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

function FieldError({
  cclassName,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors) {
      return null;
    }

    if (errors?.length === 1 && errors[0]?.message) {
      return errors[0].message;
    }

    return (
      <ul cclassName="ml-4 flex list-disc flex-col gap-2">
        {errors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      cclassName={cn("text-destructive text-sm font-normal", cclassName)}
      {...props}
    >
      {content}
    </div>
  );
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
};
