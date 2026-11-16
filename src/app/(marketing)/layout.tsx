import { getSessionUser } from "@/lib/data";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getSessionUser();
  return (
    <div className="bg-white text-ink flex flex-col min-h-screen">
      <SiteHeader loggedIn={Boolean(user)} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
