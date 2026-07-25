"use client";

import { useTranslations } from "next-intl";

import { AccountMenu } from "@/components/account-menu";
import { ButtonLink } from "@/components/button-link";
import { useSession } from "@/components/auth/use-session";
import { headerActions } from "@/lib/site";

/**
 * The right-hand header actions. Signed-out visitors see Log in / Register;
 * signed-in creators get an avatar menu (public page, dashboard, settings,
 * log out). Client island so the surrounding header stays static.
 */
export function HeaderAuth() {
  const t = useTranslations("common");
  const label = (key: string) => t(key as Parameters<typeof t>[0]);
  const session = useSession();

  if (session.status === "authed") {
    return (
      <div className="hidden items-center gap-3 lg:flex">
        <AccountMenu
          username={session.username}
          displayName={session.displayName}
          avatarUrl={session.avatarUrl}
          isAdmin={session.isAdmin}
        />
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-3 lg:flex">
      <ButtonLink href={headerActions.secondary.href} variant="secondary">
        {label(headerActions.secondary.labelKey)}
      </ButtonLink>
      <ButtonLink href={headerActions.primary.href}>
        {label(headerActions.primary.labelKey)}
      </ButtonLink>
    </div>
  );
}
