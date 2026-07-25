import { describe, expect, it } from "vitest";

import { validateUpdateInput } from "@/lib/updates/update-schema";
import {
  UPDATE_BODY_MAX_LENGTH,
  UPDATE_TITLE_MAX_LENGTH,
} from "@/lib/updates/types";

const valid = {
  title: "July update — new courses",
  body: "Played three qualifiers this month. **Progress!**",
};

describe("validateUpdateInput", () => {
  it("accepts a complete update and trims fields", () => {
    const result = validateUpdateInput({
      title: "  July update  ",
      body: "  Some progress.  ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBe("July update");
      expect(result.data.body).toBe("Some progress.");
    }
  });

  it("rejects a missing or oversize title with a coded error", () => {
    for (const title of ["", "   ", "x".repeat(UPDATE_TITLE_MAX_LENGTH + 1)]) {
      const result = validateUpdateInput({ ...valid, title });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.title).toEqual({
          code: "validation.update.title",
          params: { max: UPDATE_TITLE_MAX_LENGTH },
        });
      }
    }
  });

  it("requires a body", () => {
    const result = validateUpdateInput({ ...valid, body: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.body).toEqual({
        code: "validation.update.bodyRequired",
      });
    }
  });

  it("enforces the body length limit with a coded error", () => {
    const result = validateUpdateInput({
      ...valid,
      body: "x".repeat(UPDATE_BODY_MAX_LENGTH + 1),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.body).toEqual({
        code: "validation.update.bodyLength",
        params: { max: UPDATE_BODY_MAX_LENGTH },
      });
    }
  });

  it("reports every invalid field at once for junk payloads", () => {
    for (const payload of [null, undefined, "update"]) {
      const result = validateUpdateInput(payload);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.title?.code).toBe("validation.update.title");
        expect(result.errors.body?.code).toBe("validation.update.bodyRequired");
      }
    }
  });
});
