import { CircleDot, Flag, Target, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Hero companion card: the kinds of support a golfer can receive, shown as
 * honest category tiles instead of a mock checkout for a fictional creator
 * (the previous BuyATeeCard read as a real, confusing payment form). The
 * categories mirror real product surfaces — one-off support, wish-list
 * items (ADR-018) and goal contributions (ADR-011). Display strings live in
 * the `home` message namespace under `supportWays.items.<id>`.
 */
const ways = [
  { id: "greenFee", icon: Flag },
  { id: "balls", icon: CircleDot },
  { id: "goal", icon: Target },
  { id: "eventEntry", icon: Trophy },
] as const;

export function SupportWaysCard() {
  const t = useTranslations("home");
  return (
    <div className="w-full max-w-md rounded-3xl border border-stone/80 bg-mist/95 p-5 shadow-xl backdrop-blur-sm sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-deep">
        {t("supportWays.eyebrow")}
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-2.5">
        {ways.map(({ id, icon: Icon }) => (
          <li
            key={id}
            className="rounded-xl border border-stone/70 bg-white/80 p-4"
          >
            <Icon aria-hidden="true" className="size-5 text-forest" />
            <p className="mt-2.5 font-serif text-base font-semibold leading-snug text-ink">
              {t(`supportWays.items.${id}.name` as never)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink/60">
              {t(`supportWays.items.${id}.description` as never)}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-ink/60">{t("supportWays.note")}</p>
    </div>
  );
}
