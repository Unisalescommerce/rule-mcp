/**
 * @module scripts/bench/hook-spawn-spike
 *
 * Spike for mcp-host-integration-depth Phase 5: where does prompt-submit wall
 * time go, and how much would a thinner entry or a persistent guard recover?
 *
 * Compares:
 *   A - bare `node -e 0` spawn floor
 *   B - current full CLI: `bin/rule-mcp.js guard prompt-submit`
 *   C - thin entry: import `runGuard` only (no Commander, no bootstrapCoreTools)
 *   D - daemon-shaped: one cold import, then in-process `runGuard` calls
 *   E - spawn that only builds the Commander program and bootstraps core tools
 *   F - spawn import-only slices (directive / runGuard / buildProgram / bootstrap)
 *
 * Run: node --import ./scripts/alias-hook.mjs scripts/bench/hook-spawn-spike.mjs
 */

import { execFileSync } from "node:child_process";
import { cpus, loadavg } from "node:os";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ENTRY = `${ROOT}/bin/rule-mcp.js`;
const ALIAS = `${ROOT}/scripts/alias-hook.mjs`;
const RUNS = 9;
const WARM = 2;

const payload = JSON.stringify({
  prompt: "add pagination to the users endpoint",
  cwd: ROOT,
});

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

const round = (n) => Math.round(n * 10) / 10;

function wall(fn) {
  const started = process.hrtime.bigint();

  fn();

  return Number(process.hrtime.bigint() - started) / 1e6;
}

function benchSync(label, fn) {
  const samples = [];

  for (let i = 0; i < RUNS + WARM; i += 1) {
    const ms = wall(fn);

    if (i >= WARM) {
      samples.push(ms);
    }
  }

  return {
    label,
    n: samples.length,
    median: round(median(samples)),
    min: round(Math.min(...samples)),
    max: round(Math.max(...samples)),
  };
}

const thinSource = `
import { runGuard } from ${JSON.stringify(`${ROOT}/src/cli/guard/_run.js`)};
import { Readable } from "node:stream";
const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const stdin = Readable.from([Buffer.concat(chunks).toString("utf8")]);
stdin.isTTY = false;
await runGuard("prompt-submit", { stdin, write: (text) => process.stdout.write(text) });
`;

const programOnlySource = `
import { buildProgram } from ${JSON.stringify(`${ROOT}/src/cli/_program.js`)};
buildProgram();
const { bootstrapCoreTools } = await import(${JSON.stringify(`${ROOT}/src/tools/_bootstrap.js`)});
await bootstrapCoreTools();
process.stdout.write("ok");
`;

const rows = [
  benchSync("A spawn node -e 0", () => {
    execFileSync(process.execPath, ["-e", "0"], { stdio: "ignore" });
  }),
  benchSync("B spawn full CLI guard prompt-submit", () => {
    execFileSync(process.execPath, ["--import", ALIAS, ENTRY, "guard", "prompt-submit"], {
      cwd: ROOT,
      input: payload,
      stdio: ["pipe", "pipe", "pipe"],
    });
  }),
  benchSync("C spawn thin runGuard only", () => {
    execFileSync(process.execPath, ["--import", ALIAS, "--input-type=module", "-e", thinSource], {
      cwd: ROOT,
      input: payload,
      stdio: ["pipe", "pipe", "pipe"],
    });
  }),
  benchSync("E spawn buildProgram + bootstrapCoreTools", () => {
    execFileSync(process.execPath, ["--import", ALIAS, "--input-type=module", "-e", programOnlySource], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }),
  benchSync("F1 spawn import promptDirective", () => {
    execFileSync(
      process.execPath,
      [
        "--import",
        ALIAS,
        "--input-type=module",
        "-e",
        `import { promptDirective } from ${JSON.stringify(`${ROOT}/src/core/directive/index.js`)}; promptDirective();`,
      ],
      { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
    );
  }),
  benchSync("F2 spawn import runGuard module", () => {
    execFileSync(
      process.execPath,
      ["--import", ALIAS, "--input-type=module", "-e", `import ${JSON.stringify(`${ROOT}/src/cli/guard/_run.js`)};`],
      { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
    );
  }),
  benchSync("F3 spawn import buildProgram", () => {
    execFileSync(
      process.execPath,
      [
        "--import",
        ALIAS,
        "--input-type=module",
        "-e",
        `import { buildProgram } from ${JSON.stringify(`${ROOT}/src/cli/_program.js`)}; buildProgram();`,
      ],
      { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
    );
  }),
  benchSync("F4 spawn import bootstrapCoreTools", () => {
    execFileSync(
      process.execPath,
      [
        "--import",
        ALIAS,
        "--input-type=module",
        "-e",
        `const { bootstrapCoreTools } = await import(${JSON.stringify(`${ROOT}/src/tools/_bootstrap.js`)}); await bootstrapCoreTools();`,
      ],
      { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
    );
  }),
];

const coldStarted = process.hrtime.bigint();
const { runGuard } = await import(`${ROOT}/src/cli/guard/_run.js`);
const coldImportMs = round(Number(process.hrtime.bigint() - coldStarted) / 1e6);

const inProcess = [];

for (let i = 0; i < RUNS + WARM; i += 1) {
  const callStarted = process.hrtime.bigint();
  const stdin = Readable.from([payload]);

  stdin.isTTY = false;
  await runGuard("prompt-submit", { stdin, write: () => {} });
  const ms = Number(process.hrtime.bigint() - callStarted) / 1e6;

  if (i >= WARM) {
    inProcess.push(ms);
  }
}

const report = {
  measuredAt: new Date().toISOString(),
  node: process.version,
  cpus: cpus().length,
  loadavg: loadavg().map(round),
  quietHeuristic: loadavg()[0] <= cpus().length * 0.35,
  rows,
  daemonShaped: {
    coldImportRunGuardMs: coldImportMs,
    inProcessCallMedianMs: round(median(inProcess)),
    inProcessMinMs: round(Math.min(...inProcess)),
    inProcessMaxMs: round(Math.max(...inProcess)),
  },
  deltasMs: {
    fullMinusSpawn: round(rows[1].median - rows[0].median),
    thinMinusSpawn: round(rows[2].median - rows[0].median),
    fullMinusThin: round(rows[1].median - rows[2].median),
    programBootstrapMinusSpawn: round(rows[3].median - rows[0].median),
  },
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  const line = (cells) => cells.map((cell, i) => String(cell).padEnd(i === 0 ? 44 : 10)).join("");

  process.stdout.write(`${line(["case", "median", "min", "max"])}\n`);

  for (const row of rows) {
    process.stdout.write(`${line([row.label, row.median, row.min, row.max])}\n`);
  }

  process.stdout.write(`\nloadavg=${report.loadavg.join(",")} quiet=${report.quietHeuristic}\n`);
  process.stdout.write(
    `daemon-shaped: cold import ${report.daemonShaped.coldImportRunGuardMs} ms; in-process call median ${report.daemonShaped.inProcessCallMedianMs} ms\n`,
  );
  process.stdout.write(`deltas: ${JSON.stringify(report.deltasMs)}\n`);
}

export { report };
