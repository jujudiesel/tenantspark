import Link from "next/link";
import { notFound } from "next/navigation";
import { FEATURE_PAGES } from "@/components/marketing/features-content";
import { AppWall, Eyebrow, FAQ, FeatureRow, FinalCta, H2, PrimaryLink, SecondaryLink, Shot, Wrap } from "@/components/marketing/sections";

export function generateStaticParams() {
  return FEATURE_PAGES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = FEATURE_PAGES.find((x) => x.slug === slug);
  return f ? { title: f.nav, description: f.lead } : {};
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = FEATURE_PAGES.find((x) => x.slug === slug);
  if (!f) notFound();
  const others = FEATURE_PAGES.filter((x) => x.slug !== f.slug);

  return (
    <>
      <section className="bg-page border-b border-line">
        <Wrap className="pt-14 sm:pt-20 pb-12 sm:pb-16 flex flex-wrap items-center gap-12 lg:gap-16">
          <div className="flex-[1_1_420px] min-w-0 flex flex-col gap-6">
            <Eyebrow>{f.nav}</Eyebrow>
            <h1 className="font-display font-semibold text-[40px] sm:text-[54px] leading-[1.04] tracking-[-0.5px]">{f.title}</h1>
            <p className="max-w-[560px] text-[18px] leading-normal text-ink-2">{f.lead}</p>
            <div className="flex flex-wrap gap-3">
              <PrimaryLink href="/signup">Start free</PrimaryLink>
              <SecondaryLink href="/pricing">See pricing</SecondaryLink>
            </div>
          </div>
          <div className="flex-[1_1_440px] min-w-0">
            <Shot src={f.shot} alt={f.title} kind={f.shotKind ?? "browser"} priority />
          </div>
        </Wrap>
      </section>

      <section>
        <Wrap className="py-20 flex flex-col gap-10">
          <H2>What you get</H2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {f.points.map((p) => (
              <div key={p.title} className="bg-white border border-line rounded-[14px] p-6 flex flex-col gap-2">
                <h3 className="text-[18px] font-bold">{p.title}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{p.body}</p>
              </div>
            ))}
          </div>
        </Wrap>
      </section>

      <section className="bg-page border-y border-line">
        <Wrap className="py-20">
          <FeatureRow eyebrow={f.nav} title={f.detail.title} body={f.detail.body} bullets={f.detail.bullets} shot={f.detail.shot} shotKind={f.detail.shotKind ?? "browser"} flip />
        </Wrap>
      </section>

      {f.slug === "integrations" ? (
        <section>
          <Wrap className="py-20 flex flex-col gap-8">
            <H2>Some of the apps you can connect</H2>
            <AppWall />
          </Wrap>
        </section>
      ) : null}

      <section className={f.slug === "integrations" ? "bg-page border-y border-line" : ""}>
        <Wrap className="py-20 max-w-[900px]">
          <FAQ items={f.faq} />
        </Wrap>
      </section>

      <section className="border-t border-line">
        <Wrap className="py-14 flex flex-col gap-5">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">More features</h2>
          <div className="flex flex-wrap gap-2.5">
            {others.map((o) => (
              <Link key={o.slug} href={`/features/${o.slug}`} className="min-h-11 px-4 inline-flex items-center rounded-full border border-line text-[15px] font-semibold hover:bg-page">{o.nav}</Link>
            ))}
          </div>
        </Wrap>
      </section>

      <FinalCta />
    </>
  );
}
