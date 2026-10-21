// Title + lead at the top of every auth screen (design: AuthScreens.jsx → AuthHead).
import type { ReactNode } from "react";

export function AuthHead({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <div className="mb-7">
      <h1 className="text-[28px] leading-[34px]">{title}</h1>
      {lead && <p className="mt-2 text-[15px] leading-[22px] text-body">{lead}</p>}
    </div>
  );
}
