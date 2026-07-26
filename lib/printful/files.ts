import "server-only";

import type { PrintfulClient } from "@/lib/printful/client";
import { parseFile } from "@/lib/printful/schemas";
import type { PrintfulFile } from "@/lib/printful/types";

/**
 * Printful file registration (ADR-024). Printful pulls artwork from a URL we
 * supply — so artwork must be reachable by Printful at submission time (spec §7
 * signed/controlled URL). This registers a file and returns its Printful id for
 * reuse across mockups and orders.
 */
export function addFileByUrl(
  client: PrintfulClient,
  url: string,
  options: { filename?: string } = {},
): Promise<PrintfulFile> {
  return client.request({
    method: "POST",
    path: "/files",
    body: { url, filename: options.filename },
    parse: parseFile,
    // Adding a file is effectively idempotent on Printful's side (same URL →
    // same file), so it is safe to retry.
    retry: true,
  });
}
