/**
 * Run the four service verbs under a forced platform, with an exec that records
 * and runs nothing. The platform constants are read at load, so this child
 * fixes `process.platform` first. argv[2] is the platform.
 */
Object.defineProperty(process, "platform", { value: process.argv[2], configurable: true });

const { disableDaemonService, enableDaemonService, startDaemonService, stopDaemonService } = await import("../_service-verbs.js");
const exec = () => "";

process.stdout.write(
  JSON.stringify({
    enable: enableDaemonService({ exec }),
    disable: disableDaemonService({ exec }),
    start: startDaemonService({ exec }),
    stop: stopDaemonService({ exec }),
  }),
);
