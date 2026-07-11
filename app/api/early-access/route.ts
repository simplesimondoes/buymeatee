import { NextResponse } from "next/server";

import { validateEarlyAccessSubmission } from "@/lib/early-access/schema";
import { submitEarlyAccess } from "@/lib/early-access/service";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { status: "invalid", errors: { form: "Invalid request." } },
      { status: 400 },
    );
  }

  // Honeypot: real users never fill the hidden "website" field.
  // Bots receive a generic success and the submission is dropped.
  if (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as Record<string, unknown>).website === "string" &&
    ((payload as Record<string, unknown>).website as string).length > 0
  ) {
    return NextResponse.json({ status: "submitted" });
  }

  const result = validateEarlyAccessSubmission(payload);
  if (!result.ok) {
    return NextResponse.json(
      { status: "invalid", errors: result.errors },
      { status: 400 },
    );
  }

  const outcome = await submitEarlyAccess(result.data);
  switch (outcome) {
    case "submitted":
      return NextResponse.json({ status: "submitted" });
    case "not-configured":
      return NextResponse.json({ status: "not-configured" }, { status: 503 });
    case "failed":
      return NextResponse.json({ status: "failed" }, { status: 502 });
  }
}
