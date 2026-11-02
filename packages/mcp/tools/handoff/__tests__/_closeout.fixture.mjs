/** Fixture shared by the closeout tests: one done and one open doc per kind. */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const PLAN_DONE = "# done plan\n\nStatus: `done`\n\n- [x] **Step 1**: first.\n- [x] **1.1**: sub.\n";
export const PLAN_OPEN = "# open plan\n\nStatus: `in-progress`\n\n- [x] **Step 1**: first.\n- [ ] **Step 2**: second.\n";
export const REVIEW_DONE = "# done review\n\n| Finding | Severity | Status |\n| --- | --- | --- |\n| OSS-1 | high | resolved |\n";
export const REVIEW_OPEN = "# open review\n\n| Finding | Severity | Status |\n| --- | --- | --- |\n| OSS-1 | high | open |\n";
export const AUDIT = "# audit\n\n| What | How | Result |\n| --- | --- | --- |\n| X | `ls` | ok |\n";
export const AUTHOR = "test <t@t.t>";

/** A project with one done and one open doc per kind, plus an orphan audit. */
export function seed() {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-closeout-"));

  for (const sub of ["audits", "reviews", "plans", "adr"]) {
    mkdirSync(join(dir, "docs", sub), { recursive: true });
  }

  writeFileSync(join(dir, "docs/plans/done.md"), PLAN_DONE);
  writeFileSync(join(dir, "docs/plans/open.md"), PLAN_OPEN);
  writeFileSync(join(dir, "docs/reviews/done.md"), REVIEW_DONE);
  writeFileSync(join(dir, "docs/reviews/open.md"), REVIEW_OPEN);
  writeFileSync(join(dir, "docs/audits/done.md"), AUDIT);
  writeFileSync(join(dir, "docs/audits/orphan.md"), AUDIT);

  return dir;
}
