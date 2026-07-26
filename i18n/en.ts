/**
 * Static English source catalog.
 *
 * English is the source of truth: its shape drives the typed message keys
 * (see types.d.ts) and it is the guaranteed fallback for every other locale.
 * Add every new namespace file here — the import map below is the single
 * place that defines which namespaces exist.
 */
import admin from "@/messages/en/admin.json";
import audiences from "@/messages/en/audiences.json";
import auth from "@/messages/en/auth.json";
import blog from "@/messages/en/blog.json";
import common from "@/messages/en/common.json";
import content from "@/messages/en/content.json";
import dashboard from "@/messages/en/dashboard.json";
import discover from "@/messages/en/discover.json";
import emails from "@/messages/en/emails.json";
import errors from "@/messages/en/errors.json";
import faq from "@/messages/en/faq.json";
import gifts from "@/messages/en/gifts.json";
import home from "@/messages/en/home.json";
import journey from "@/messages/en/journey.json";
import legal from "@/messages/en/legal.json";
import marketing from "@/messages/en/marketing.json";
import meta from "@/messages/en/meta.json";
import profilePage from "@/messages/en/profilePage.json";
import settings from "@/messages/en/settings.json";
import shop from "@/messages/en/shop.json";

export const enMessages = {
  admin,
  audiences,
  auth,
  blog,
  common,
  content,
  dashboard,
  discover,
  emails,
  errors,
  faq,
  gifts,
  home,
  journey,
  legal,
  marketing,
  meta,
  profilePage,
  settings,
  shop,
};

export type Messages = typeof enMessages;

export const messageNamespaces = Object.keys(enMessages) as Array<
  keyof Messages
>;
