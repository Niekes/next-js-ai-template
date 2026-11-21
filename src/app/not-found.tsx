import Link from "next/link";

import { AppPage } from "@/components/app-page";
import { ROUTES } from "@/const/routes";

const NotFoundPage = () => (
  <AppPage title="Page not found">
    <Link href={ROUTES.home} className="underline">
      Go to the start page
    </Link>
  </AppPage>
);

export default NotFoundPage;
