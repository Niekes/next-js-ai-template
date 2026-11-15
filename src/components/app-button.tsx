import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

const variantMap = {
  primary: "default",
  secondary: "secondary",
  ghost: "ghost",
  outline: "outline",
  error: "destructive",
} as const;

type AppButtonProps = Omit<ComponentProps<typeof Button>, "variant"> & {
  variant?: keyof typeof variantMap;
};

/** The house button: shadcn's Button with the app's variant names. */
export const AppButton = ({ variant = "primary", ...props }: AppButtonProps) => (
  <Button variant={variantMap[variant]} {...props} />
);
