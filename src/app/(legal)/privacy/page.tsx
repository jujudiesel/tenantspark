export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>
        This policy is a placeholder while TenantSpark is in early access. A full policy is being prepared with a lawyer and will
        replace this page before billing starts. If you have questions, email hello@tenantspark.com.
      </p>
      <h2>What we store</h2>
      <p>
        Your name, email and password (encrypted), and the property, unit, tenant and lease information you enter. Tenant contact
        details are stored so you can reach your tenants and invite them to the tenant portal.
      </p>
      <h2>Where it lives</h2>
      <p>Data is stored with Supabase on Amazon Web Services servers in the United States, and the website runs on Vercel.</p>
      <h2>What we don&apos;t do</h2>
      <p>We don&apos;t sell your data or your tenants&apos; data, and we don&apos;t show ads.</p>
    </>
  );
}
