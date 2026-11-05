import assert from "node:assert/strict";
import test from "node:test";
import { GUARDRAILS } from "../index.js";

const rule = GUARDRAILS.find((item) => item.id === "secret-detection");
const token = "gh" + "p_aB3dE5fG7hI9jK1mN3pQ5rS7tU9vW1xY3zA5";

for (const fileName of [".env", ".env.production", "config.yml", "config.yaml", "config.json", "Dockerfile", "id.pem", "id.key", "src/config.js", "src/config.ts", "README.md"]) {
  test(`detects provider tokens in ${fileName}`, () => {
    const report = rule.check(token, { fileName });

    assert.equal(report.pass, false);
    assert.ok(!JSON.stringify(report).includes(token));
  });
}

test("detects a generic unquoted dotenv credential", () => {
  const secret = "not-a-real-secret-123";
  const report = rule.check(`API_KEY=${secret}\n`, { fileName: ".env.local" });

  assert.equal(report.pass, false);
  assert.ok(!JSON.stringify(report).includes(secret));
});

test("detects generic JSON credential properties", () => {
  assert.equal(rule.check('{"api_key": "not-a-real-secret-123"}', { fileName: "config.json" }).pass, false);
});

test("does not flag environment references or obvious dotenv examples", () => {
  for (const code of ["API_KEY=${API_KEY}", "API_KEY=", "API_KEY=your_api_key_here", "# API_KEY=unsafe-literal-value"]) {
    assert.equal(rule.check(code, { fileName: ".env.example" }).pass, true, code);
  }
});

test("does not apply dotenv parsing to source code", () => {
  assert.equal(rule.check("const API_KEY=unquotedVariableName;", { fileName: "config.js" }).pass, true);
});
