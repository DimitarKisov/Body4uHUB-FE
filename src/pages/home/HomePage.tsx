// Screen 0 · Начална страница, route "/" — public, no API calls yet (design: ui_kits/home/Home.jsx, hero variant "light").
// Trainers/articles are static samples (see sampleData.ts).
// Mobile-first: base classes = phone (<900px, home.css "Mobile refinements"); desktop goes in min-[900px]: (the design's breakpoint).
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { publicWrap } from "@/lib/layout";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";
import { SAMPLE_ARTICLES, SAMPLE_TRAINERS } from "@/pages/home/sampleData";

const section = "py-9 min-[900px]:py-[72px]";
const wideButton = "w-full min-[900px]:w-auto";

function Hero() {
  const { t } = useTranslation();
  return (
    <div className={publicWrap}>
      <section className="grid grid-cols-1 items-center gap-6 pt-5 pb-8 min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] min-[900px]:gap-14 min-[900px]:pt-14 min-[900px]:pb-20">
        <div>
          <h1 className="text-[34px] leading-[38px] tracking-[-0.03em] min-[900px]:text-[56px] min-[900px]:leading-[60px]">{t("home.hero.title")}</h1>
          <p className="mt-3 max-w-[520px] text-base leading-6 text-body min-[900px]:mt-4 min-[900px]:text-lg min-[900px]:leading-7">{t("home.hero.lead")}</p>
          <div className="mt-6 flex flex-col gap-2.5 min-[900px]:mt-7 min-[900px]:flex-row min-[900px]:flex-wrap">
            <Button asChild size="lg" className={wideButton}>
              <a href="#trainers">
                {t("home.hero.find")}
                <ArrowRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary" className={wideButton}>
              <Link to="/register">{t("home.register")}</Link>
            </Button>
          </div>
        </div>
        <div className="relative aspect-[16/11] w-full overflow-hidden rounded-lg min-[900px]:aspect-[4/5] min-[900px]:max-h-[560px]">
          <ImagePlaceholder />
        </div>
      </section>
    </div>
  );
}

function Directions() {
  const { t } = useTranslation();
  return (
    <section className={cn(section, "pt-4 min-[900px]:pt-4")}>
      <div className={publicWrap}>
        {/* Phone: compact 2×2 grid, no footer row. */}
        <div className="grid grid-cols-2 gap-2.5 min-[900px]:grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] min-[900px]:gap-3">
          {MODULES.map(({ id, to, icon: Icon }) => (
            <Link
              key={id}
              to={to}
              className="group flex flex-col gap-1 rounded-lg border border-border bg-card p-4 text-foreground transition-colors duration-[120ms] hover:border-border-strong min-[900px]:min-h-[200px] min-[900px]:gap-2 min-[900px]:p-6"
            >
              <span className="mb-2.5 flex size-10 items-center justify-center rounded-md bg-muted [&_svg]:size-[22px] min-[900px]:mb-3 min-[900px]:size-11">
                <Icon />
              </span>
              <span className="font-display text-base leading-[22px] font-semibold tracking-[-0.015em] min-[900px]:text-xl min-[900px]:leading-[26px]">{t(`home.nav.${id}`)}</span>
              <span className="text-[13px] leading-[18px] text-body min-[900px]:text-sm">{t(`home.dir.${id}.text`)}</span>
              <span className="mt-auto hidden items-center justify-between pt-4 min-[900px]:flex">
                <span className="text-[13px] leading-none font-semibold">{t(`home.dir.${id}.cta`)}</span>
                <span className="flex size-9 items-center justify-center rounded-full border border-border-strong transition-colors duration-[120ms] group-hover:border-primary group-hover:bg-primary">
                  <ArrowRight className="size-4" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, more, to }: { eyebrow: string; title: string; more: string; to: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-4 min-[900px]:mb-6">
      <div>
        <div className="mb-2 text-xs leading-4 font-semibold tracking-[0.06em] text-muted-foreground uppercase">{eyebrow}</div>
        <h2 className="text-[22px] leading-7 min-[900px]:text-[32px] min-[900px]:leading-[38px]">{title}</h2>
      </div>
      <Link to={to} className="inline-flex items-center gap-1.5 py-2.5 text-sm leading-none font-semibold text-foreground hover:underline hover:underline-offset-[3px]">
        {more}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function Trainers() {
  const { t } = useTranslation();
  return (
    <section id="trainers" className={cn(section, "scroll-mt-16")}>
      <div className={publicWrap}>
        <SectionHead eyebrow={t("home.nav.trainers")} title={t("home.trainers.title")} more={t("home.dir.trainers.cta")} to="/trainers" />
        {/* Phone: horizontal snap carousel of 68% cards, bleeding past the 16px gutter. */}
        <div className="-mx-4 grid snap-x snap-mandatory auto-cols-[68%] grid-flow-col gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[900px]:mx-0 min-[900px]:snap-none min-[900px]:auto-cols-auto min-[900px]:grid-flow-row min-[900px]:grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] min-[900px]:gap-4 min-[900px]:overflow-visible min-[900px]:px-0 min-[900px]:pb-0">
          {SAMPLE_TRAINERS.map((tr) => (
            <Link key={tr.id} to="/trainers" className="flex snap-start flex-col gap-3 text-foreground">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg">
                <ImagePlaceholder />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-base leading-[22px] font-semibold tracking-[-0.01em]">{tr.name}</div>
                  <div className="mt-0.5 text-sm text-body">{tr.spec}</div>
                </div>
                <Badge tone="trainer" className="hidden min-[900px]:inline-flex">{t("role.Trainer")}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Articles() {
  const { t } = useTranslation();
  return (
    <section className={section}>
      <div className={publicWrap}>
        <SectionHead eyebrow={t("home.nav.articles")} title={t("home.articles.title")} more={t("home.articles.more")} to="/articles" />
        {/* Phone: one card of compact rows with an 84px thumbnail. */}
        <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card min-[900px]:grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] min-[900px]:gap-4 min-[900px]:divide-y-0 min-[900px]:overflow-visible min-[900px]:rounded-none min-[900px]:border-0 min-[900px]:bg-transparent">
          {SAMPLE_ARTICLES.map((a) => (
            <Link
              key={a.id}
              to="/articles"
              className="flex items-center gap-3.5 p-3 text-foreground transition-colors duration-[120ms] min-[900px]:flex-col min-[900px]:items-stretch min-[900px]:gap-0 min-[900px]:overflow-hidden min-[900px]:rounded-lg min-[900px]:border min-[900px]:border-border min-[900px]:bg-card min-[900px]:p-0 min-[900px]:hover:border-border-strong"
            >
              <div className="relative aspect-square w-[84px] flex-none overflow-hidden rounded-sm min-[900px]:aspect-[16/10] min-[900px]:w-full min-[900px]:rounded-none">
                <ImagePlaceholder />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5 min-[900px]:gap-2 min-[900px]:px-5 min-[900px]:pt-[18px] min-[900px]:pb-5">
                <Badge className="hidden self-start min-[900px]:inline-flex">{a.category}</Badge>
                <div className="font-display text-[15px] leading-5 font-semibold tracking-[-0.01em] text-balance min-[900px]:text-[17px] min-[900px]:leading-[23px]">{a.title}</div>
                <div className="flex items-center gap-1.5 text-[13px] leading-[18px] text-muted-foreground">
                  <Clock className="size-3.5" />
                  {t("home.articles.min", { min: a.minutes })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrainerBand() {
  const { t } = useTranslation();
  return (
    <section className={section}>
      <div className={publicWrap}>
        <div className="grid grid-cols-1 items-center gap-6 rounded-lg bg-secondary px-5 py-7 text-secondary-foreground min-[900px]:grid-cols-[1fr_auto] min-[900px]:px-14 min-[900px]:py-12">
          <div>
            <h2 className="text-[22px] leading-7 text-card min-[900px]:text-[32px] min-[900px]:leading-[38px]">{t("home.band.title")}</h2>
            <p className="mt-2.5 max-w-[520px] text-base text-border-strong">{t("home.band.text")}</p>
          </div>
          <Button asChild size="lg" className={wideButton}>
            <Link to="/register">{t("home.register")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function HomePage(): ReactNode {
  return (
    <>
      <Hero />
      <Directions />
      <Trainers />
      <Articles />
      <TrainerBand />
    </>
  );
}
