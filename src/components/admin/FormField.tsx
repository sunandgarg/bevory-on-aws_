import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}

const FormField = ({ 
  label, 
  required = false, 
  error, 
  children, 
  hint,
  className 
}: FormFieldProps) => {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className={cn(error && "text-destructive")}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className={cn(error && "[&>*]:border-destructive [&>*]:ring-destructive/20")}>
        {children}
      </div>
      {hint && !error && (
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-sm text-destructive font-medium">{error}</p>
      )}
    </div>
  );
};

export default FormField;
