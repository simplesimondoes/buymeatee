import { formatMinorAmount } from "@/lib/payments/currency";
import type { RecentSupportItem } from "@/lib/support/public";

/**
 * Recent supporters as social proof. Names already have the anonymity choice
 * applied upstream; messages and names render as plain text (React-escaped),
 * never markdown. No amounts-are-invented risk: these are verified paid gifts.
 */
export function RecentSupport({
  items,
}: {
  items: RecentSupportItem[];
}) {
  if (items.length === 0) {
    return (
      <section
        aria-label="Recent support"
        className="rounded-3xl border border-dashed border-stone bg-mist p-6 text-center"
      >
        <p className="text-sm leading-relaxed text-ink/70">
          Be the first golfer to back this project.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Recent support" className="space-y-4">
      <h2 className="font-serif text-xl font-semibold text-forest">
        Recent support
      </h2>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={index}
            className="rounded-2xl border border-stone bg-white p-4 sm:p-5"
          >
            <p className="text-sm text-ink">
              <span className="font-semibold text-forest">
                {item.displayName}
              </span>{" "}
              supported with{" "}
              <span className="font-semibold">
                {formatMinorAmount(item.amount, item.currency)}
              </span>
            </p>
            {item.message ? (
              <p className="mt-1.5 text-sm italic leading-relaxed text-ink/70">
                &ldquo;{item.message}&rdquo;
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
