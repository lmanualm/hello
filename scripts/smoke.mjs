#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const HOST = "127.0.0.1";
const READY_TIMEOUT_MS = 30_000;
const READY_POLL_MS = 250;

async function pickFreePort() {
  if (process.env.SMOKE_PORT) return Number(process.env.SMOKE_PORT);
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, HOST, () => {
      const address = server.address();
      if (typeof address === "object" && address) {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error("could not determine free port")));
      }
    });
  });
}

const REQUIRED_MARKERS = ["<h1>hello</h1>", "Something small is on the way."];

function logStep(msg) {
  process.stdout.write(`[smoke] ${msg}\n`);
}

async function waitForReady(targetUrl, deadline) {
  while (Date.now() < deadline) {
    try {
      const res = await fetch(targetUrl, { method: "HEAD" });
      if (res.ok || res.status === 405) return;
    } catch {
      // server not up yet
    }
    await delay(READY_POLL_MS);
  }
  throw new Error(`server did not become ready within ${READY_TIMEOUT_MS}ms`);
}

async function main() {
  const port = await pickFreePort();
  const url = `http://${HOST}:${port}/`;
  logStep(`starting next start on ${HOST}:${port}`);
  const child = spawn(
    "node",
    ["node_modules/next/dist/bin/next", "start", "--hostname", HOST, "--port", String(port)],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  const childExit = new Promise((resolve) => {
    child.on("exit", (code, signal) => resolve({ code, signal }));
  });

  let serverOutput = "";
  child.stdout.on("data", (buf) => {
    serverOutput += buf.toString();
  });
  child.stderr.on("data", (buf) => {
    serverOutput += buf.toString();
  });

  let exitCode = 0;
  try {
    await Promise.race([
      waitForReady(url, Date.now() + READY_TIMEOUT_MS),
      childExit.then(({ code, signal }) => {
        throw new Error(`server exited before ready (code=${code} signal=${signal})\n${serverOutput}`);
      }),
    ]);

    logStep(`GET ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`unexpected status ${res.status}`);
    }
    const body = await res.text();
    logStep(`response status=${res.status} bytes=${body.length}`);

    for (const marker of REQUIRED_MARKERS) {
      if (!body.includes(marker)) {
        process.stderr.write(`[smoke] body preview:\n${body.slice(0, 1200)}\n`);
        throw new Error(`response missing required marker: ${JSON.stringify(marker)}`);
      }
    }
    logStep(`OK — landing page rendered (${body.length} bytes)`);
  } catch (err) {
    exitCode = 1;
    process.stderr.write(`[smoke] FAIL: ${err instanceof Error ? err.message : String(err)}\n`);
    if (serverOutput) {
      process.stderr.write(`[smoke] server output:\n${serverOutput}\n`);
    }
  } finally {
    child.kill("SIGTERM");
    const killTimer = delay(5_000).then(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    });
    await Promise.race([childExit, killTimer]);
  }

  process.exit(exitCode);
}

main().catch((err) => {
  process.stderr.write(`[smoke] unexpected: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
