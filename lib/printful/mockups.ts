import "server-only";

import type { PrintfulClient } from "@/lib/printful/client";
import { parseMockupTask } from "@/lib/printful/schemas";
import type { PrintfulMockupTask } from "@/lib/printful/types";

/**
 * Printful mockup generation (ADR-024, spec §9). Asynchronous: create a task,
 * then poll the task key OR receive the mockup_task_finished webhook. The
 * caller (lib/merch) stores the task key and processes completion idempotently.
 * The mockup generator has a LOWER rate limit than the general API.
 */

export interface CreateMockupInput {
  variantIds: number[];
  /** Printful file ids or URLs by placement. */
  files: Array<{ placement: string; imageUrl: string }>;
  /** Optional print-file position (scale/area) already translated to Printful. */
  format?: "jpg" | "png";
}

/** Kick off an async mockup task; returns the task key + initial status. */
export function createMockupTask(
  client: PrintfulClient,
  catalogProductId: number,
  input: CreateMockupInput,
): Promise<PrintfulMockupTask> {
  return client.request({
    method: "POST",
    path: `/mockup-generator/create-task/${encodeURIComponent(String(catalogProductId))}`,
    body: {
      variant_ids: input.variantIds,
      format: input.format ?? "png",
      files: input.files.map((f) => ({ placement: f.placement, image_url: f.imageUrl })),
    },
    parse: parseMockupTask,
    // Creating a task is NOT retried automatically: a duplicate task wastes the
    // constrained mockup quota. lib/merch guards against concurrent requests
    // via the printful_mockup_tasks one-in-flight unique index.
    retry: false,
  });
}

/** Fetch the current state (and results, when completed) of a mockup task. */
export function getMockupTask(
  client: PrintfulClient,
  taskKey: string,
): Promise<PrintfulMockupTask> {
  return client.request({
    method: "GET",
    path: `/mockup-generator/task?task_key=${encodeURIComponent(taskKey)}`,
    parse: parseMockupTask,
  });
}
