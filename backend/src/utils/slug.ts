import Organization from "../models/Organization";

/** Turns a display name into a URL/lookup-safe slug base, e.g. "Acme Inc." -> "acme-inc". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "organization";
}

/** Appends a numeric suffix until the slug is unique, so two organizations named the same thing never collide. */
export async function generateUniqueOrganizationSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;

  while (await Organization.exists({ slug: candidate })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}
