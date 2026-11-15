import Link from "next/link";

import { AppPage } from "@/components/app-page";
import { ROUTES } from "@/const/routes";

const HomePage = () => (
  <AppPage title="Next.js AI Template">
    <p className="mb-4 text-muted-foreground">
      Architecture, gates and agent rules are in place. Start with the notes example.
    </p>
    <Link href={ROUTES.notes} className="underline">
      Open your notes
    </Link>
  </AppPage>
);

export default HomePage;
