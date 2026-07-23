import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ModerationAction } from "@/components/admin/moderation-action";
import { listRecentContent, type RecentContent } from "@/lib/admin/moderation";
import { formatMinorAmount } from "@/lib/payments/currency";
import { isAdmin } from "@/lib/payments/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Moderation admin",
  robots: { index: false, follow: false },
};

/**
 * Review queue over creator-entered public content: recently changed goals
 * and profiles, each with item-level takedown/restore. Page-level takedown
 * lives on the user detail page. Policy: docs/moderation-policy.md (draft,
 * marked for legal review).
 */
export default async function AdminModerationPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/sign-in?next=%2Fadmin%2Fmoderation");
  }
  if (!(await isAdmin(user.id))) {
    notFound();
  }

  let content: RecentContent = { goals: [], profiles: [] };
  let unavailable = false;
  try {
    content = await listRecentContent();
  } catch {
    unavailable = true;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        Admin
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest">
        Moderation
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">
        Recently changed public content, newest first. Takedowns record a
        reason in the audit log; removed text is preserved there too. Policy
        draft:{" "}
        <span className="font-medium">docs/moderation-policy.md</span>{" "}
        (pending legal review).
      </p>

      {unavailable ? (
        <div
          role="alert"
          className="mt-8 rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
        >
          Moderation isn&apos;t available right now.
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <section aria-label="Recent goals">
            <h2 className="font-serif text-xl font-semibold text-forest">
              Goals ({content.goals.length})
            </h2>
            {content.goals.length === 0 ? (
              <p className="mt-2 text-sm text-ink/60">No goals yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {content.goals.map((goal) => (
                  <li
                    key={goal.id}
                    className="rounded-2xl border border-stone bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          {goal.title}{" "}
                          {goal.taken_down_at ? (
                            <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800">
                              Taken down
                            </span>
                          ) : (
                            <span className="ml-1 rounded-full bg-mist px-2 py-0.5 text-xs text-ink/60">
                              {goal.status}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-sm text-ink/70">
                          {goal.creator_display_name}
                          {goal.creator_username ? (
                            <>
                              {" · "}
                              <Link
                                href={`/admin/users/${goal.creator_id}`}
                                className="text-forest underline underline-offset-2"
                              >
                                /t/{goal.creator_username}
                              </Link>
                            </>
                          ) : null}
                          {" · "}
                          {formatMinorAmount(goal.target_amount, goal.currency)} target
                        </p>
                        {goal.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-ink/60">
                            {goal.description}
                          </p>
                        ) : null}
                      </div>
                      <ModerationAction
                        payload={
                          goal.taken_down_at
                            ? { action: "goal_restore", goalId: goal.id }
                            : { action: "goal_take_down", goalId: goal.id }
                        }
                        label={goal.taken_down_at ? "Restore" : "Take down"}
                        destructive={!goal.taken_down_at}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Recent profiles">
            <h2 className="font-serif text-xl font-semibold text-forest">
              Profiles with public content ({content.profiles.length})
            </h2>
            {content.profiles.length === 0 ? (
              <p className="mt-2 text-sm text-ink/60">
                No profiles with bios or photos yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {content.profiles.map((profile) => (
                  <li
                    key={profile.id}
                    className="rounded-2xl border border-stone bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          <Link
                            href={`/admin/users/${profile.id}`}
                            className="text-forest underline underline-offset-2"
                          >
                            {profile.display_name || "(no name)"}
                          </Link>
                          {profile.username ? (
                            <span className="ml-2 text-sm font-normal text-ink/60">
                              /t/{profile.username}
                            </span>
                          ) : null}
                        </p>
                        {profile.bio ? (
                          <p className="mt-1 line-clamp-2 text-sm text-ink/60">
                            {profile.bio}
                          </p>
                        ) : null}
                      </div>
                      <span className="flex flex-wrap gap-2">
                        {profile.bio ? (
                          <ModerationAction
                            payload={{ action: "clear_bio", userId: profile.id }}
                            label="Clear bio"
                          />
                        ) : null}
                        {profile.avatar_url ? (
                          <ModerationAction
                            payload={{ action: "remove_avatar", userId: profile.id }}
                            label="Remove photo"
                          />
                        ) : null}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
