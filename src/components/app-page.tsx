import { cn } from "cn";
import type { ReactNode } from "react";

export const AppPage = ({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) => (
  <section className={cn("mx-auto w-full max-w-3xl flex-1 p-4 lg:p-8", className)}>
    <h1 className="mb-6 text-lg font-medium text-foreground lg:text-2xl">{title}</h1>
    {children}
  </section>
);
