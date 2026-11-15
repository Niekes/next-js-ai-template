import { type ComponentProps, useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AppInputProps = ComponentProps<typeof Input> & { label: string };

/** A labelled text input; the label is always rendered so every field has an accessible name. */
export const AppInput = ({ label, id, ...props }: AppInputProps) => {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} {...props} />
    </div>
  );
};
