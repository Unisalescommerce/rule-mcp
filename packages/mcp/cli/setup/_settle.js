/** The exit status the plain runner and the wizard share. */

export const settleExit = (counts) => {
  if (counts.fail > 0) {
    process.exitCode = 1;
  }
};
