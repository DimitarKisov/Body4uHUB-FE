// "Four tiles" hub mark: 2×2 modules meeting in one place; the rounded 4th tile is "you". (design/components/core/Logo.jsx)
import { cn } from "@/lib/utils";

const TILES = [[12, 12], [34, 12], [12, 34]] as const;
const PALETTE = {
  dark: ["var(--foreground)", "var(--background)", "var(--primary)"],
  accent: ["var(--primary)", "var(--foreground)", "var(--card)"],
  light: ["var(--card)", "var(--foreground)", "var(--primary)"],
  mono: ["none", "currentColor", "currentColor"],
} as const;

type Variant = keyof typeof PALETTE;

export function LogoMark({ size = 32, variant = "dark", title = "Body4uHUB" }: { size?: number; variant?: Variant; title?: string }) {
  const [bg, fg, ac] = PALETTE[variant];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label={title} className="block flex-none">
      {bg !== "none" && <rect width="64" height="64" rx="16" fill={bg} />}
      {variant === "light" && <rect x=".5" y=".5" width="63" height="63" rx="15.5" stroke="var(--border)" />}
      {TILES.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="18" height="18" rx="5" fill={fg} />)}
      <rect x="34" y="34" width="18" height="18" rx="9" fill={ac} />
    </svg>
  );
}

const SIZES = { sm: [24, 15], md: [32, 18], lg: [44, 24], xl: [64, 36] } as const;

export function Logo({ size = "md", variant = "dark", showMark = true, onDark = false, className }: {
  size?: keyof typeof SIZES; variant?: Variant; showMark?: boolean; onDark?: boolean; className?: string;
}) {
  const [mark, text] = SIZES[size];
  return (
    <span className={cn("inline-flex items-center", className)} style={{ gap: Math.round(mark * 0.32) }} aria-label="Body4uHUB">
      {showMark && <LogoMark size={mark} variant={variant} />}
      <span aria-hidden="true" className={cn("font-display font-semibold leading-none tracking-[-0.03em] whitespace-nowrap", onDark ? "text-card" : "text-foreground")} style={{ fontSize: text }}>
        Body
        {onDark ? <span className="text-primary">4u</span> : <span className="mx-[.04em] rounded-[4px] bg-primary px-[.14em] text-primary-foreground">4u</span>}
        HUB
      </span>
    </span>
  );
}
