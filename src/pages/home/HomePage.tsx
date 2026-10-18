// Screen 0 · Начална страница, route "/" — public, no API calls yet (design: ui_kits/home/Home.jsx, hero variant "light").
// Trainers/articles are static samples (see sampleData.ts).
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

const section = "py-12 min-[900px]:py-[72px]";

function Hero() {
  const { t } = useTranslation();
  return (
    <div className={publicWrap}>
      <section className="grid grid-cols-1 items-center gap-8 pt-8 pb-12 min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] min-[900px]:gap-14 min-[900px]:pt-14 min-[900px]:pb-20">
        <div>
          <h1 className="text-[36px] leading-10 tracking-[-0.03em] min-[900px]:text-[56px] min-[900px]:leading-[60px]">{t("home.hero.title")}</h1>
          <p className="mt-4 max-w-[520px] text-lg leading-7 text-body">{t("home.hero.lead")}</p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Button asChild size="lg">
              <a href="#trainers">
                {t("home.hero.find")}
                <ArrowRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/register">{t("home.register")}</Link>
            </Button>
          </div>
        </div>
        <div className="relative aspect-[4/5] max-h-[560px] w-full overflow-hidden rounded-lg">
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
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3">
          {MODULES.map(({ id, to, icon: Icon }) => (
            <Link
              key={id}
              to={to}
              className="group flex min-h-[200px] flex-col gap-2 rounded-lg border border-border bg-card p-6 text-foreground transition-colors duration-[120ms] hover:border-border-strong"
            >
              <span className="mb-3 flex size-11 items-center justify-center rounded-md bg-muted [&_svg]:size-[22px]">
                <Icon />
              </span>
              <span className="font-display text-xl leading-[26px] font-semibold tracking-[-0.015em]">{t(`home.nav.${id}`)}</span>
              <span className="text-sm text-body">{t(`home.dir.${id}.text`)}</span>
              <span className="mt-auto flex items-center justify-between pt-4">
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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-2 text-xs leading-4 font-semibold tracking-[0.06em] text-muted-foreground uppercase">{eyebrow}</div>
        <h2 className="text-[26px] leading-8 min-[900px]:text-[32px] min-[900px]:leading-[38px]">{title}</h2>
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-4">
          {SAMPLE_TRAINERS.map((tr) => (
            <Link key={tr.id} to="/trainers" className="flex flex-col gap-3 text-foreground">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg">
                <ImagePlaceholder />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-base leading-[22px] font-semibold tracking-[-0.01em]">{tr.name}</div>
                  <div className="mt-0.5 text-sm text-body">{tr.spec}</div>
                </div>
                <Badge tone="trainer">{t("role.Trainer")}</Badge>
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
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
          {SAMPLE_ARTICLES.map((a) => (
            <Link
              key={a.id}
              to="/articles"
              className="flex flex-col overflow-hidden rounded-lg border border-border bg-card text-foreground transition-colors duration-[120ms] hover:border-border-strong"
            >
              <div className="relative aspect-[16/10] w-full">
                <ImagePlaceholder />
              </div>
              <div className="flex flex-col gap-2 px-5 pt-[18px] pb-5">
                <Badge className="self-start">{a.category}</Badge>
                <div className="font-display text-[17px] leading-[23px] font-semibold tracking-[-0.01em] text-balance">{a.title}</div>
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
        <div className="grid grid-cols-1 items-center gap-6 rounded-lg bg-secondary px-6 py-8 text-secondary-foreground min-[900px]:grid-cols-[1fr_auto] min-[900px]:px-14 min-[900px]:py-12">
          <div>
            <h2 className="text-[26px] leading-8 text-card min-[900px]:text-[32px] min-[900px]:leading-[38px]">{t("home.band.title")}</h2>
            <p className="mt-2.5 max-w-[520px] text-base text-border-strong">{t("home.band.text")}</p>
          </div>
          <Button asChild size="lg">
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
