// Wraps `playwright test` because on Windows, Playwright's own webServer teardown can hang:
// it signals the `next start -p 3104` process it spawned and waits for it to exit, but that
// process doesn't reliably act on the signal on Windows, so Playwright's process (and the
// npm script waiting on it) never returns control to the shell without a manual Ctrl+C.
// (See playwright.config.ts webServer comment for the related, previously-diagnosed issue
// where a lingering server on this port also caused stale-CSS test failures.)
//
// Playwright's reporter only prints its final "N passed" summary line AFTER teardown
// completes, so when teardown is what's stuck, that line never appears - detecting "tests are
// done" from it doesn't work here. Instead, track individual "ok"/"not ok" result lines against
// the total Playwright announces at the start ("Running N tests"). Once every test has reported,
// the run itself is done and anything after that is teardown. If teardown hasn't finished within
// a grace period, force-kill whatever is listening on the port ourselves, which unblocks
// Playwright's wait; if the process still hasn't exited shortly after that, kill it directly
// rather than hang indefinitely.
import { execSync, spawn } from "node:child_process"
import path from "node:path"

const PORT = 3104
const TEARDOWN_GRACE_MS = 10_000
const FORCE_EXIT_GRACE_MS = 5_000

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

function killProcessTree(pid) {
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

// Built as a single pre-quoted string (not an args array) so shell:true - needed on Windows
// to resolve npx.cmd - doesn't trigger Node's DEP0190 unescaped-concatenation warning.
const commandLine = ["npx", "playwright", "test", ...process.argv.slice(2)].map(quoteArg).join(" ")
const child = spawn(commandLine, { stdio: ["inherit", "pipe", "pipe"], shell: true })

let settled = false
let expectedTotal = null
let completedCount = 0
let sawFailure = false
let teardownTimer = null
let forceExitTimer = null
let buffer = ""

function finish(code) {
  if (settled) return
  settled = true
  clearTimeout(teardownTimer)
  clearTimeout(forceExitTimer)
  killPort(PORT)
  process.exitCode = code
}

function scheduleTeardownWatch() {
  if (teardownTimer || settled) return
  teardownTimer = setTimeout(() => {
    if (settled) return
    // Every announced test has reported and Playwright still hasn't exited: teardown is stuck.
    // Killing the server it's waiting on should let it finish tearing down on its own.
    killPort(PORT)
    forceExitTimer = setTimeout(() => {
      if (settled) return
      killProcessTree(child.pid)
      finish(sawFailure ? 1 : 0)
    }, FORCE_EXIT_GRACE_MS)
  }, TEARDOWN_GRACE_MS)
}

function forward(target, chunk) {
  target.write(chunk)
  buffer += chunk.toString()

  if (expectedTotal === null) {
    const totalMatch = buffer.match(/Running (\d+) tests?/)
    if (totalMatch) expectedTotal = Number(totalMatch[1])
  }

  const lines = buffer.split("\n")
  buffer = lines.pop() ?? ""
  for (const line of lines) {
    if (/^\s*(ok|not ok)\s+\d+\s/.test(line)) {
      completedCount += 1
      if (/^\s*not ok\s/.test(line)) sawFailure = true
    }
  }

  if (expectedTotal !== null && completedCount >= expectedTotal) {
    scheduleTeardownWatch()
  }
}

child.stdout.on("data", (chunk) => forward(process.stdout, chunk))
child.stderr.on("data", (chunk) => forward(process.stderr, chunk))

child.on("exit", (code) => {
  finish(code ?? (sawFailure ? 1 : 0))
})
