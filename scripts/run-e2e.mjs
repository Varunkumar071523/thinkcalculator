// Wraps `playwright test` for two reasons.
//
// 1) On Windows, Playwright's own webServer teardown can hang: it signals the `next start`
// process it spawned and waits for it to exit, but that process doesn't reliably act on the
// signal on Windows, so Playwright's process (and the npm script waiting on it) never returns
// control to the shell without a manual Ctrl+C.
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
//
// 2) The server's port is picked fresh (OS-assigned, via `get-port`) on every invocation instead
// of a hardcoded constant (Sprint 43). A hardcoded port meant two invocations running at the same
// time - e.g. this branch and another git worktree checked out on `main` - would race for the
// same port: whichever one's `killPort()` ran second would kill the other's live dev server
// mid-run. Each invocation now gets its own port and cannot see or touch another invocation's
// server. The port is threaded to `playwright test` via the `E2E_PORT` env var (see
// playwright.config.ts).
//
// Once `playwright test` exits (its own process exit, not the server's), this script tears down
// the server (and, if it also needed to intervene, the test runner) via `killProcessTree`, which
// delegates to the `tree-kill` package for a real recursive kill on both Windows and POSIX -
// see the comment on `killProcessTree` below for why a hand-rolled `taskkill`/`SIGKILL` pair
// wasn't a complete substitute for that.
//
// A `run-<pid>.json` pidfile (see `PID_DIR` below) records the server/test PIDs for the
// in-progress run. If a previous invocation was killed hard enough that its own SIGINT/SIGTERM
// handlers never got to run (e.g. a human force-stopping a hung run from Task Manager or
// PowerShell's `Stop-Process`, which - unlike Ctrl+C in the same console - delivers no signal
// Node can catch), this script finds that stale pidfile on its *next* invocation and reaps the
// orphaned tree before doing anything else. That is what removes the manual "kill stray
// processes before every verification round" step: cleanup no longer depends on the previous run
// having exited cleanly, and it no longer depends on a hardcoded port to find what to clean up.
import { spawn } from "node:child_process"
import fs from "node:fs"
import http from "node:http"
import os from "node:os"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

import getPort from "get-port"
import treeKill from "tree-kill"

// `tree-kill`'s Windows implementation shells out to bare `taskkill` via `child_process.exec`
// (no fully-qualified path), which relies on `taskkill.exe` being resolvable on `PATH`. When this
// script is launched from a Git-Bash/MSYS shell (as it is in local dev on this project), the
// inherited `PATH` is MSYS-flavored and does not include `C:\Windows\System32` at all - confirmed
// directly: `exec('taskkill ...')` under that PATH fails with "'taskkill' is not recognized," and
// `tree-kill` swallows that failure into its callback's `err` argument, which nothing was
// checking, so the kill silently no-opped. Fixing it here (ensure this process's own PATH
// includes System32 before anything spawns) is the root cause fix: it makes every subprocess this
// script or its dependencies launch resolve Windows system binaries normally, instead of needing
// every individual call site (here or inside a dependency) to hand-qualify executable paths.
if (process.platform === "win32") {
  const system32 = path.join(process.env.SystemRoot || "C:\\Windows", "System32")
  const pathParts = (process.env.PATH || process.env.Path || "").split(path.delimiter)
  if (!pathParts.some((part) => path.resolve(part || ".") === system32)) {
    process.env.PATH = [process.env.PATH || "", system32].filter(Boolean).join(path.delimiter)
  }
}

const SERVER_READY_TIMEOUT_MS = 60_000
const SERVER_POLL_INTERVAL_MS = 200

// Shared by every invocation (any worktree, any branch) so a stale run from one checkout is
// found and reaped by the next invocation from any other checkout, not just the same one.
// Exported for scripts/__tests__/run-e2e-teardown.test.ts.
export const PID_DIR = path.join(os.tmpdir(), "thinkcalculator-e2e-runs")

function pidFilePath(pid) {
  return path.join(PID_DIR, `run-${pid}.json`)
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

// Exported for scripts/__tests__/run-e2e-teardown.test.ts. Delegates the actual recursive kill to
// `tree-kill` instead of a hand-rolled `taskkill /T /F` (Windows) / bare `process.kill` (POSIX)
// pair. The hand-rolled POSIX path only ever killed the exact PID it was given, which was a
// deliberate, documented, and true-at-the-time contract (this script only ever directly spawned
// one `next start` process on POSIX, with no shell/grandchild layer under it). `tree-kill` makes
// the same guarantee (walk `ps` and kill every descendant) without that being a manually
// maintained invariant - if a future change puts a shell or child process between this script and
// the server (or the test runner) on POSIX, teardown stays correct without anyone having to
// remember to revisit this function.
export function killProcessTree(pid) {
  if (!pid) return Promise.resolve()
  return new Promise((resolve) => {
    treeKill(pid, "SIGKILL", () => resolve())
  })
}

// Reaps a previous invocation's server/test process trees from its pidfile, if that invocation
// never got to clean up after itself. Safe to call unconditionally at the top of every run: a
// missing directory, a missing/malformed file, or PIDs that are already gone are all treated as
// "nothing to do," not errors.
//
// Gated on `record.runPid` (the owning run-e2e.mjs process itself) being dead, NOT on whether
// `serverPid`/`testsPid` are alive. Caught by Sprint 43's own concurrency proof (two invocations
// started at once, per docs on item 1): an earlier version of this function checked only
// `serverPid`/`testsPid` liveness, so a second invocation starting up while a first invocation's
// server was still mid-boot read the first invocation's own pidfile, saw its (legitimately
// running) server PID as "still alive," and reaped it as if it were orphaned - killing a live
// concurrent run's server out from under it. A run's server/test PIDs are *expected* to be alive
// for as long as that run's own process is alive; they only indicate an orphan once the process
// that was supposed to own and eventually clean them up no longer exists.
export async function reapStaleRuns() {
  let entries
  try {
    entries = fs.readdirSync(PID_DIR)
  } catch {
    return
  }
  for (const entry of entries) {
    const filePath = path.join(PID_DIR, entry)
    let record
    try {
      record = JSON.parse(fs.readFileSync(filePath, "utf8"))
    } catch {
      fs.rmSync(filePath, { force: true })
      continue
    }
    if (record.runPid && isProcessAlive(record.runPid)) {
      // A different invocation is genuinely in progress right now - not our business.
      continue
    }
    const pids = [record.serverPid, record.testsPid].filter(Boolean)
    const stillAlive = pids.filter(isProcessAlive)
    if (stillAlive.length > 0) {
      console.error(
        `[run-e2e] found a stale run (pid ${record.runPid}) still holding process(es) ${stillAlive.join(", ")} - it was likely force-killed without a chance to clean up. Reaping it now.`,
      )
      await Promise.all(stillAlive.map((pid) => killProcessTree(pid)))
    }
    fs.rmSync(filePath, { force: true })
  }
}

function writePidFile(runPid, record) {
  fs.mkdirSync(PID_DIR, { recursive: true })
  fs.writeFileSync(pidFilePath(runPid), JSON.stringify(record))
}

function removePidFile(runPid) {
  fs.rmSync(pidFilePath(runPid), { force: true })
}

function quoteArg(arg) {
  if (/^[A-Za-z0-9_\-.:\\/=]+$/.test(arg)) return arg
  return `"${arg.replace(/"/g, '\\"')}"`
}

function waitForServerReady(baseUrl, deadline) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(baseUrl, (res) => {
        res.resume()
        resolve()
      })
      req.on("error", () => {
        if (Date.now() >= deadline) {
          reject(new Error(`Server did not respond on ${baseUrl} within ${SERVER_READY_TIMEOUT_MS}ms`))
          return
        }
        setTimeout(attempt, SERVER_POLL_INTERVAL_MS)
      })
    }
    attempt()
  })
}

async function main() {
  await reapStaleRuns()

  const port = await getPort()
  const baseUrl = `http://127.0.0.1:${port}`

  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next")
  // Invoke Next's bin script directly with `node` rather than via `npx`/a `.cmd` shim: that keeps
  // this the real server process's own PID, with no intermediary shell process in between whose
  // exit doesn't imply the server underneath it has exited too.
  const server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
  })
  server.stdout.on("data", (chunk) => process.stdout.write(chunk))
  server.stderr.on("data", (chunk) => process.stderr.write(chunk))

  let testsProcess = null
  writePidFile(process.pid, { runPid: process.pid, serverPid: server.pid, testsPid: null })

  let tornDown = false
  async function teardown() {
    if (tornDown) return
    tornDown = true
    await Promise.all([killProcessTree(server.pid), killProcessTree(testsProcess?.pid)])
    removePidFile(process.pid)
  }

  // If this script itself is interrupted (Ctrl+C, or a parent process signaling it), make sure
  // neither the server nor an in-flight test run outlives it as an orphan.
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      await teardown()
      process.exit(1)
    })
  }

  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS
  try {
    await Promise.race([
      waitForServerReady(baseUrl, deadline),
      new Promise((_, reject) => {
        server.once("exit", (code) => {
          reject(new Error(`Server process exited early (code ${code}) before becoming ready`))
        })
      }),
    ])
  } catch (error) {
    console.error(`[run-e2e] ${error.message}`)
    await teardown()
    process.exitCode = 1
    return
  }

  const commandLine = ["npx", "playwright", "test", ...process.argv.slice(2)].map(quoteArg).join(" ")
  testsProcess = spawn(commandLine, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, E2E_PORT: String(port) },
  })
  writePidFile(process.pid, { runPid: process.pid, serverPid: server.pid, testsPid: testsProcess.pid })

  const code = await new Promise((resolve) => {
    testsProcess.on("exit", (code) => resolve(code ?? 1))
  })

  // The test run's own process has exited, which is now meaningful on its own: with
  // `reuseExistingServer: true` and this script's server already answering before `playwright
  // test` started, Playwright never spawned or owned a server process, so it had nothing to wait
  // on during teardown and this exit was not gated on anything Windows-specific.
  await teardown()
  process.exitCode = code
}

// Guarded so scripts/__tests__/run-e2e-teardown.test.ts can import killProcessTree without also
// triggering a real `next start` + `playwright test` run as a side effect of the import.
const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
if (isMainModule) {
  main()
}
