// Wraps `playwright test` because on Windows, Playwright's own webServer teardown can hang: it
// signals the `next start -p 3104` process it spawned and waits for it to exit, but that process
// doesn't reliably act on the signal on Windows, so Playwright's process (and the npm script
// waiting on it) never returns control to the shell without a manual Ctrl+C.
//
// A prior version of this script tried to detect "the run is done" by parsing stdout for a
// `Running N tests` line and counting `ok`/`not ok` result lines, then force-killing the server
// after a grace period. That detection was dead code: `ok NN` / `not ok NN` is TAP-reporter
// syntax, but playwright.config.ts uses the `list` reporter, which prints `✓`/`✘` status marks
// instead and never emits a line matching that regex. So `completedCount` never reached
// `expectedTotal`, the grace-period kill never armed, and the wrapper was reduced to nothing but
// `child.on("exit")` - i.e. functionally identical to running `npx playwright test` directly,
// which is exactly the hang this script exists to work around.
//
// The actual fix: don't let Playwright spawn or own the server at all, and don't infer
// completion from log text. This script starts `next start` itself by invoking Next's bin script
// directly with `node` (no shell, no npx, no .cmd wrapper), so the PID it gets back is the real
// server process, not an intermediary shell. It waits for the server to answer HTTP requests
// (a real readiness check, not a text match), then runs `playwright test` with
// `webServer.reuseExistingServer: true` (see playwright.config.ts). Playwright's own webServer
// plugin, on seeing the URL already answering with reuseExistingServer set, returns immediately
// without spawning or owning a process (see node_modules/playwright/lib/runner/index.js,
// WebServerPlugin._startProcess: `if (isAlreadyAvailable) { if (reuseExistingServer) return; }`).
// Its teardown then has nothing to wait on, so it cannot hang - the Windows termination-signal
// problem is avoided structurally instead of detected-and-killed after the fact.
// Once `playwright test` exits (its own process exit, not the server's), this script kills the
// server it started via `taskkill /PID <pid> /T /F`, using the PID it already holds - no guessing
// which process is listening on the port.
import { execSync, spawn } from "node:child_process"
import http from "node:http"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const PORT = 3104
const BASE_URL = `http://127.0.0.1:${PORT}`
const SERVER_READY_TIMEOUT_MS = 60_000
const SERVER_POLL_INTERVAL_MS = 200

// This environment's child-process PATH doesn't reliably include System32, so bare
// netstat/findstr/taskkill fail with "not recognized" - use fully-qualified paths.
const SYSTEM32 = path.join(process.env.SystemRoot || "C:\\Windows", "System32")
const NETSTAT = path.join(SYSTEM32, "netstat.exe")
const FINDSTR = path.join(SYSTEM32, "findstr.exe")
const TASKKILL = path.join(SYSTEM32, "taskkill.exe")

function listPidsOnPort(port) {
  if (process.platform !== "win32") return []
  try {
    const out = execSync(`"${NETSTAT}" -ano | "${FINDSTR}" :${port}`, { encoding: "utf8" })
    const pids = new Set()
    for (const line of out.split("\n")) {
      const match = line.trim().match(/LISTENING\s+(\d+)\s*$/)
      if (match) pids.add(match[1])
    }
    return [...pids]
  } catch {
    return []
  }
}

function killPort(port) {
  if (process.platform === "win32") {
    for (const pid of listPidsOnPort(port)) {
      try {
        execSync(`"${TASKKILL}" /PID ${pid} /T /F`, { stdio: "ignore" })
      } catch {
        // already gone
      }
    }
  } else {
    try {
      execSync(`lsof -ti:${port} | xargs -r kill -9`, { shell: "/bin/sh", stdio: "ignore" })
    } catch {
      // nothing listening on the port
    }
  }
}

// Exported for scripts/__tests__/run-e2e-teardown.test.ts: this is the function standing in for
// "reliably tear down the whole process tree," so it's what a regression needs to exercise.
// `/T` is load-bearing - it recurses to child/grandchild processes, not just `pid` itself. A bare
// `process.kill(pid)` (POSIX SIGKILL semantics) has no such recursion and is exactly the shape of
// regression this would silently reintroduce.
export function killProcessTree(pid) {
  if (!pid) return
  try {
    if (process.platform === "win32") {
      execSync(`"${TASKKILL}" /PID ${pid} /T /F`, { stdio: "ignore" })
    } else {
      process.kill(pid, "SIGKILL")
    }
  } catch {
    // already gone
  }
}

function quoteArg(arg) {
  if (/^[A-Za-z0-9_\-.:\\/=]+$/.test(arg)) return arg
  return `"${arg.replace(/"/g, '\\"')}"`
}

function waitForServerReady(deadline) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(BASE_URL, (res) => {
        res.resume()
        resolve()
      })
      req.on("error", () => {
        if (Date.now() >= deadline) {
          reject(new Error(`Server did not respond on ${BASE_URL} within ${SERVER_READY_TIMEOUT_MS}ms`))
          return
        }
        setTimeout(attempt, SERVER_POLL_INTERVAL_MS)
      })
    }
    attempt()
  })
}

async function main() {
  // Clear out anything left listening from a previous crashed/interrupted run before starting -
  // a stale server on this port has previously caused confusing stale-CSS test failures (see the
  // webServer comment in playwright.config.ts).
  killPort(PORT)

  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next")
  // Invoke Next's bin script directly with `node` rather than via `npx`/a `.cmd` shim: that keeps
  // this the real server process's own PID, with no intermediary shell process in between whose
  // exit doesn't imply the server underneath it has exited too.
  const server = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
  })
  server.stdout.on("data", (chunk) => process.stdout.write(chunk))
  server.stderr.on("data", (chunk) => process.stderr.write(chunk))

  // If this script itself is interrupted (Ctrl+C, or a parent process signaling it), make sure
  // the server it owns doesn't outlive it as an orphan.
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      killProcessTree(server.pid)
      killPort(PORT)
      process.exit(1)
    })
  }

  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS
  try {
    await Promise.race([
      waitForServerReady(deadline),
      new Promise((_, reject) => {
        server.once("exit", (code) => {
          reject(new Error(`Server process exited early (code ${code}) before becoming ready`))
        })
      }),
    ])
  } catch (error) {
    console.error(`[run-e2e] ${error.message}`)
    killProcessTree(server.pid)
    killPort(PORT)
    process.exitCode = 1
    return
  }

  const commandLine = ["npx", "playwright", "test", ...process.argv.slice(2)].map(quoteArg).join(" ")
  const tests = spawn(commandLine, { stdio: "inherit", shell: true })

  const code = await new Promise((resolve) => {
    tests.on("exit", (code) => resolve(code ?? 1))
  })

  // The test run's own process has exited, which is now meaningful on its own: with
  // `reuseExistingServer: true` and this script's server already answering before `playwright
  // test` started, Playwright never spawned or owned a server process, so it had nothing to wait
  // on during teardown and this exit was not gated on anything Windows-specific.
  killProcessTree(server.pid)
  killPort(PORT)
  process.exitCode = code
}

// Guarded so scripts/__tests__/run-e2e-teardown.test.ts can import killProcessTree without also
// triggering a real `next start` + `playwright test` run as a side effect of the import.
const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
if (isMainModule) {
  main()
}
