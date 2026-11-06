/**
 * A skill file declares its name the way the loader reads it.
 *
 * Copilot CLI answered "Failed to load 62 skills" for an install that had
 * written all of them: every SKILL.md carried `name: /rule`, and the slash is
 * how a user invokes a skill, not how one is declared. The documented shape is
 * `name: image-convert` - the bare id, matching the directory it sits in.
 *
 * A loader rejects the set rather than the entry, so one wrong field took out
 * every skill on the machine. That is the reason this is asserted per rendered
 * file instead of trusted to the format table.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { renderAgentCommandFiles } from "../_render.js";

const frontmatterOf = (content) => content.split("---", 2)[1] ?? "";
const nameOf = (content) => /^name: (.+)$/mu.exec(frontmatterOf(content))?.[1];

test("a skill's name is a bare id, never a slash command", () => {
  const files = renderAgentCommandFiles("skill");

  assert.ok(files.length > 0, "the format renders the catalog");

  for (const { name, filename, content } of files) {
    assert.equal(nameOf(content), name, `${name}: the name field is the skill id`);
    assert.ok(!name.startsWith("/"), `${name}: a declared name never carries the invocation slash`);
    assert.equal(filename, `${name}/SKILL.md`, `${name}: one directory per skill, one SKILL.md inside`);
  }
});

test("the directory a skill lands in is the name it declares", () => {
  for (const { name, filename, content } of renderAgentCommandFiles("skill")) {
    const dir = filename.split("/", 1)[0];

    assert.equal(dir, nameOf(content), `${name}: the loader compares the two, and a mismatch drops the skill`);
  }
});
