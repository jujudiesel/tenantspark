import { headers } from "next/headers";

/** The address people are using right now (tenantspark.com in production), from the request. */
export async function siteUrl() {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // Not inside a request (build time). Fall through.
  }
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function inviteUrl(token: string) {
  return `${await siteUrl()}/invite/${token}`;
}
