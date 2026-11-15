import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/app/dashboard/sign-out-button";
import { ROUTES } from "@/const/routes";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <>
    <header className="flex items-center justify-between border-b px-4 py-3">
      <Link href={ROUTES.home} className="font-medium">
        Home
      </Link>
      <SignOutButton />
    </header>
    {children}
  </>
);

export default DashboardLayout;
