/** Render the doctor report sections for the terminal. */
import { banner, color, section } from "../index.js";
import { agentIcon, agentsSection, truncate, yesNo } from "./_sections-agents.js";

export { agentIcon, agentsSection, truncate, yesNo } from "./_sections-agents.js";
import { WRAPPER_SCRIPT_PATH } from "../daemon/index.js";

/** Icon for a boolean status. */
export function statusIcon(ok) {
  return ok ? color("✅", "green") : color("❌", "red");
}

/** Icon for one agent row. */

/** Banner, status line, and the System section. */
export function systemSection(report) {
  return [
    banner("🩺 rule-mcp doctor", report.ok ? "healthy" : "needs attention"),
    "",
    `${color("Status", "bold")}: ${statusIcon(report.ok)} ${report.ok ? color("healthy", "green") : color("needs attention", "red")}`,
    "",
    section("System", "🖥️"),
    `Version:     ${color(report.version, "green")}`,
    `MCP SDK:     ${color(report.sdk, "cyan")}`,
    `Node:        ${color(report.node, report.nodeOk === false ? "yellow" : "cyan")}${report.nodeOk === false ? color(` - ${report.nodeFloor} or newer is required`, "yellow") : ""}`,
    `Platform:    ${color(`${report.platform}/${report.arch}`, "magenta")}`,
    `Entrypoint:  ${color(truncate(report.entrypoint, 100), "dim")}`,
    ...(report.launcher ? [`Launcher:    ${color(report.launcher.label, report.launcher.kind === "none" ? "yellow" : "green")}`] : []),
    ...(report.launcherSkip && (report.launcher?.kind !== "copy" || String(report.launcherSkip.at).slice(0, 10) > String(report.launcher?.installedAt))
      ? [`Gate skip:   ${color(`${report.launcherSkip.at ?? "unknown"} ${report.launcherSkip.reason}`, "yellow")}`]
      : []),
    "",
  ];
}

/** The MCP Tools section: registered count and a sample of names. */
export function toolsSection(report) {
  const sampleTools = (report.tools || []).slice(0, 12);

  return [
    section("MCP Tools", "🧰"),
    `Registered:  ${color((report.tools || []).length, "green")}`,
    `Examples:    ${sampleTools.map((tool) => color(tool, "cyan")).join(", ")}${(report.tools || []).length > sampleTools.length ? color(", ...", "dim") : ""}`,
    "",
  ];
}

/** The Daemon section: pid-file process state and the native service. */
export function daemonSection(report) {
  const native = report.daemon?.nativeService || {};

  return [
    "",
    section("Daemon", "🚀"),
    `Process:     ${report.daemon?.running ? color(`running (pid ${report.daemon.pid})`, "green") : color("not running via pid file", "yellow")}`,
    `Service:     ${color(native.service || "none", "cyan")} on ${color(native.platform || report.platform, "magenta")}`,
    `Installed:   ${yesNo(native.installed)}`,
    `Loaded:      ${yesNo(native.loaded)}`,
    `Running:     ${yesNo(native.running)}${native.pid ? ` ${color(`(pid ${native.pid})`, "dim")}` : ""}`,
    `Login Item:  ${color("rule-mcpd", native.platform === "macos" ? "cyan" : "dim")}${native.platform === "macos" ? color(" (daemon wrapper in Login Items)", "dim") : ""}`,
    `PID file:    ${color(truncate(report.daemon?.pidFile || "", 100), "dim")}`,
    `Log file:    ${color(truncate(report.daemon?.logFile || "", 100), "dim")}`,
    `Wrapper:     ${color(truncate(WRAPPER_SCRIPT_PATH, 100), "dim")}`,
  ];
}

/** The Models section: how many providers have a configured key. */
export function modelsSection(report) {
  return ["", section("Models", "🧠"), `Configured providers: ${color(report.models?.totalConfigured ?? 0, (report.models?.totalConfigured ?? 0) > 0 ? "green" : "yellow")}`];
}

/** The Runtime paths section. */
export function pathsSection(report) {
  return [
    "",
    section("Runtime paths", "📁"),
    `State:       ${color(truncate(report.stateDir, 100), "dim")}`,
    `Data:        ${color(truncate(report.dataDir, 100), "dim")}`,
    `Config:      ${color(truncate(report.configDir, 100), "dim")}`,
  ];
}

/** The Automation section: how to get machine-readable output. */
export function automationSection() {
  return [
    "",
    section("Automation", "⚙️"),
    `📤 Use ${color("`rule-mcp doctor --json`", "cyan")} to print machine-readable JSON.`,
    `💾 Use ${color("`rule-mcp doctor --json-out <file>`", "cyan")} to export JSON while keeping this UI.`,
  ];
}
