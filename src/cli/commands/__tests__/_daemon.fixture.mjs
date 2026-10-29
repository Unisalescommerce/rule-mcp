/** The daemon test's own port and polling helpers: a real process on a real port needs both. */

import { createServer } from "node:net";

/**
 * A free loopback port, asked of the kernel rather than assumed.
 *
 * The daemon is a real process on a real port. While this test hardcoded 37999
 * and the user's own home, a parallel suite could answer the health check for
 * it - the port was shared with the daemon of whoever ran the tests.
 *
 * @returns {Promise<number>}
 */
async function freePort() {
  const server = createServer();

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));

  return port;
}

/** Poll the health endpoint until the daemon answers, or give up. */
export async function waitForHealth(port, { timeoutMs = 15000, stepMs = 200 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let last = null;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);

      if (res.status === 200) {
        return res;
      }

      last = res;
    } catch (error) {
      last = error;
    }

    await new Promise((r) => setTimeout(r, stepMs));
  }

  throw new Error(`the daemon never answered on ${port}: ${last}`);
}

/** Poll until nothing answers on the daemon port, or give up. */
export async function waitForClosed(port, { timeoutMs = 5000, stepMs = 200 } = {}) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      await fetch(`http://127.0.0.1:${port}/health`);
    } catch {
      return;
    }

    await new Promise((r) => setTimeout(r, stepMs));
  }

  throw new Error(`something still answers on ${port} after stop`);
}

export { freePort };
