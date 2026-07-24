"use client";

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
  const session = useSession();

  if (session.status === "authed") {
    return (
      <div className="hidden items-center gap-3 lg:flex">
        <AccountMenu
          username={session.username}
          displayName={session.displayName}
          avatarUrl={session.avatarUrl}
        />
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-3 lg:flex">
      <ButtonLink href={headerActions.secondary.href} variant="secondary">
        {headerActions.secondary.label}
      </ButtonLink>
      <ButtonLink href={headerActions.primary.href}>
        {headerActions.primary.label}
      </ButtonLink>
    </div>
  );
}
