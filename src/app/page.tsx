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
    <p className="mt-8 text-sm text-muted-foreground">
      Like this template?{" "}
      <a href="https://github.com/Niekes/next-js-ai-template" className="underline">
        ⭐ Star it on GitHub
      </a>{" "}
      ·{" "}
      <a href="https://github.com/sponsors/niekes" className="underline">
        💖 Sponsor
      </a>
    </p>
  </AppPage>
);

export default HomePage;
