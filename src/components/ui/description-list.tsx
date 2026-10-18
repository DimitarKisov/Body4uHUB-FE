// Label/value rows (design: components.css .b4u-dl). Stacked on phones, 200px label column from md.
import type { ReactNode } from "react";

export function DescriptionList({ items }: { items: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="grid">
      {items.map((item, i) => (
        <div key={i} className="grid gap-1 border-b border-border py-3.5 last:border-b-0 md:grid-cols-[200px_1fr] md:items-center md:gap-4">
          <dt className="text-[13px] leading-[18px] font-medium text-muted-foreground">{item.label}</dt>
          <dd className="tabular flex min-w-0 flex-wrap items-center gap-2 text-base [overflow-wrap:anywhere] text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
