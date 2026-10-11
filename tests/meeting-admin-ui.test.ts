import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("meeting detail actions", () => {
  it("keeps the existing edit flow and delete confirmation reachable without a duplicate dead editor", () => {
    const source = readFileSync("src/app/admin/(protected)/meetings/meetings-app.tsx", "utf8");
    expect(source).toContain("onClick={onEdit}");
    expect(source).toContain("setEditMeetingId(detail.id)");
    expect(source).toContain("setShowDelete(true)");
    expect(source).toContain("Delete Permanently");
    expect(source).not.toContain("function EditDrawer(");
  });
});
