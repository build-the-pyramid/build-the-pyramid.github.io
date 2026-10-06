import { CalendarCheck2 } from "lucide-react";
import type { SeoPageDefinition } from "@/config/types";
import { siteSkin } from "@/config/skin";
import { pageSchemas } from "@/lib/schema";
import { getRelatedPages } from "@/content/registry";
import { assetPath } from "@/lib/urls";
import { NativeAdSlot } from "@/components/integrations/native-ad-slot";
import { ResponsiveBanner } from "@/components/integrations/responsive-banner";
import { Breadcrumbs } from "./breadcrumbs";
import { Faq } from "./faq";
import { JsonLd } from "./json-ld";
import { PageSections } from "./page-sections";
import { RelatedPages } from "./related-pages";
import { SkinSeoPage } from "./skin-seo-page";
import { WikiSeoPage } from "./wiki-seo-page";

export function SeoPage({ page }: { page: SeoPageDefinition }) {
  if (siteSkin() === "wiki") return <WikiSeoPage page={page} />;
  if (siteSkin() !== "portal") return <SkinSeoPage page={page} />;

  const related = getRelatedPages(page);

  return (
    <>
      <JsonLd data={pageSchemas(page)} />
      <main>
        <section className="hero-surface border-b border-border">
          <div className="site-container py-8 sm:py-12">
            <Breadcrumbs slug={page.slug} current={page.hero.heading} />
            {page.hero.eyebrow ? <p className="eyebrow">{page.hero.eyebrow}</p> : null}
            <h1 className="max-w-4xl">{page.hero.heading}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">{page.hero.lead}</p>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarCheck2 size={17} className="text-primary" />
              Last updated: <time dateTime={page.lastReviewed}>{new Date(`${page.lastReviewed}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</time>
            </p>
          </div>
        </section>

        <ResponsiveBanner />

        <div className="site-container space-y-20 py-8 sm:py-12">
          <PageSections sections={page.sections} afterOpeningContent={<NativeAdSlot />} />
          {page.screenshots?.length ? (
            <section>
              <h2>Gameplay Screenshots</h2>
              <div className="mt-7 grid gap-5 md:grid-cols-2">
                {page.screenshots.map((shot) => (
                  <figure className="content-card" key={shot.src}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={assetPath(shot.src)} alt={shot.alt} className="w-full rounded-[calc(var(--radius)*.7)]" />
                    {shot.caption ? <figcaption className="mt-3 text-sm text-muted-foreground">{shot.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
            </section>
          ) : null}
          {page.faq?.length ? <Faq items={page.faq} /> : null}
          <RelatedPages pages={related} />
        </div>
      </main>
    </>
  );
}
