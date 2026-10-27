/**
 * @module scripts/bench/guard-daemon-spike
 *
 * After ADR 187: does a Unix-socket daemon + `--send` beat a full `guard`
 * spawn? Hosts still spawn a client per hook; the only win is a cheaper client.
 *
 * Run: node --import ./scripts/alias-hook.mjs scripts/bench/guard-daemon-spike.mjs
 */

import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir, cpus, loadavg } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ENTRY = `${ROOT}/bin/rule-mcp.js`;
const ALIAS = `${ROOT}/scripts/alias-hook.mjs`;
const RUNS = 9;
const WARM = 2;

const home = mkdtempSync(join(tmpdir(), "rule-mcp-guard-bench-"));

process.env.RULE_MCP_HOME = home;
mkdirSync(join(home, "state"), { recursive: true });

const payload = JSON.stringify({ prompt: "add pagination to the users endpoint", cwd: ROOT });
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const round = (n) => Math.round(n * 10) / 10;

function wall(fn) {
  const started = process.hrtime.bigint();

  fn();

  return Number(process.hrtime.bigint() - started) / 1e6;
}

function bench(label, fn) {
  const samples = [];

  for (let i = 0; i < RUNS + WARM; i += 1) {
    const ms = wall(fn);

    if (i >= WARM) {
      samples.push(ms);
    }
  }

  return { label, median: round(median(samples)), min: round(Math.min(...samples)), max: round(Math.max(...samples)) };
}

const daemon = spawn(process.execPath, ["--import", ALIAS, ENTRY, "guard", "--daemon"], {
  cwd: ROOT,
  env: process.env,
  stdio: "ignore",
});

await new Promise((resolve) => setTimeout(resolve, 400));

const thinSend = `
import { sendGuardRequest } from ${JSON.stringify(`${ROOT}/src/cli/guard/_send.js`)};
const answer = await sendGuardRequest({
  action: "prompt-submit",
  payload: ${payload},
});
if (!answer.includes("UserPromptSubmit")) process.exit(2);
`;

const rows = [
  bench("A node -e 0", () => {
    execFileSync(process.execPath, ["-e", "0"], { stdio: "ignore" });
  }),
  bench("B full CLI guard prompt-submit", () => {
    execFileSync(process.execPath, ["--import", ALIAS, ENTRY, "guard", "prompt-submit"], {
      cwd: ROOT,
      env: process.env,
      input: payload,
      stdio: ["pipe", "pipe", "pipe"],
    });
  }),
  bench("S bin guard --send (early dispatch)", () => {
    execFileSync(process.execPath, [ENTRY, "guard", "--send", "prompt-submit"], {
      cwd: ROOT,
      env: process.env,
      input: payload,
      stdio: ["pipe", "pipe", "pipe"],
    });
  }),
  bench("T thin import sendGuardRequest only", () => {
    execFileSync(process.execPath, ["--import", ALIAS, "--input-type=module", "-e", thinSend], {
      cwd: ROOT,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }),
];

daemon.kill("SIGTERM");
rmSync(home, { recursive: true, force: true });

const report = {
  measuredAt: new Date().toISOString(),
  node: process.version,
  cpus: cpus().length,
  loadavg: loadavg().map(round),
  rows,
  deltasMs: {
    sendMinusFull: round(rows[2].median - rows[1].median),
    thinMinusFull: round(rows[3].median - rows[1].median),
    thinMinusSpawn: round(rows[3].median - rows[0].median),
  },
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
