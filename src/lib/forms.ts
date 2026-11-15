import { ROUTES } from "@/const/routes";

/** A text field from a submitted form; missing fields and file inputs read as "". */
export const formText = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};

/** The `?next=` target after sign-in; only same-site paths, so it cannot redirect off the site. */
export const returnPath = (search: string) => {
  const next = new URLSearchParams(search).get("next");
  return next && /^\/(?![/\\])\S*$/.test(next) ? next : ROUTES.notes;
};
