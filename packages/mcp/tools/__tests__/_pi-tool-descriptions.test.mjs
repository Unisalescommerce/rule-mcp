/** Discovery terms must describe the capabilities each tool actually offers. */
import assert from "node:assert/strict";
import test from "node:test";
import { listTools } from "../router/index.js";
import { registerHandoffTool } from "../handoff/_register.js";
import { registerHandonTool } from "../handon/_register.js";
import { registerCheckTool } from "../skill/_check-tool.js";
import { registerGatewayTool } from "../gateway/_register.js";

registerHandoffTool();
registerHandonTool();
registerCheckTool();
await registerGatewayTool();

const descriptions = new Map(listTools().map((tool) => [tool.name, tool.description.toLowerCase()]));

for (const name of ["rule_tool_handoff", "rule_tool_handon"]) {
  test(`${name} is discoverable for session recovery and planning`, () => {
    for (const word of ["session", "resume", "close", "plan"]) {
      assert.ok(descriptions.get(name).includes(word), `${name} must mention ${word}`);
    }
  });
}

for (const name of ["rule_tool_check", "rule_tool_gateway"]) {
  test(`${name} is discoverable for guardrail verification`, () => {
    for (const word of ["verify", "lint", "guardrail", "decision"]) {
      assert.ok(descriptions.get(name).includes(word), `${name} must mention ${word}`);
    }
  });
}
