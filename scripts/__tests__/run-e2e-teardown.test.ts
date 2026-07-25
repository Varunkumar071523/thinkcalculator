// Regression coverage for the Windows `run-e2e.mjs` teardown hang (see the file-level comment in
// ../run-e2e.mjs and docs/DECISIONS.md). The hang's root cause was structural - Playwright owning
// and trying to signal a server process it can't reliably terminate on Windows - and the fix is
// structural too (never let Playwright own that process). That's not exercised by a unit test.
//
// What *is* unit-testable, and what would silently regress if someone "simplified" `killProcessTree`
// back to a bare `process.kill(pid)`, is the process-TREE part of the fix: killing the server's
// PID must also reap anything it spawned, not just the one process. This test builds a real
// 2-level process tree (child + grandchild), asks `killProcessTree` to tear down the child, and
// asserts the whole tree is gone within a bounded time - not just that the call returned.
//
// Since Sprint 43, `killProcessTree` delegates to the `tree-kill` package rather than a hand-rolled
// `taskkill /T /F` (Windows) / bare `SIGKILL` (POSIX) pair, specifically so this guarantee holds on
// both platforms rather than being a manually maintained, platform-conditional invariant - so the
// grandchild-reaped assertion below is unconditional, not gated on `process.platform`.
import { execSync, spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { killProcessTree, PID_DIR, reapStaleRuns } from "../run-e2e.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE = path.join(__dirname, "fixtures", "spawn-process-tree.mjs")

const SYSTEM32 = path.join(process.env.SystemRoot || "C:\\Windows", "System32")
const TASKLIST = path.join(SYSTEM32, "tasklist.exe")

function isProcessAlive(pid) {
  if (process.platform === "win32") {
    try {
      const out = execSync(`"${TASKLIST}" /FI "PID eq ${pid}"`, { encoding: "utf8" })
      return out.includes(String(pid))
    } catch {
      return false
    }
  }
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function waitUntil(predicate, { timeoutMs, intervalMs = 100 }) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return true
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  return predicate()
}

function readGrandchildPid(child) {
  return new Promise((resolve, reject) => {
    let buffer = ""
    const onData = (chunk) => {
      buffer += chunk.toString()
      const match = buffer.match(/GRANDCHILD_PID=(\d+)/)
      if (match) {
        child.stdout.off("data", onData)
        resolve(Number(match[1]))
      }
    }
    child.stdout.on("data", onData)
    child.once("error", reject)
  })
}

describe("killProcessTree", () => {
  it(
    "terminates a spawned process tree within a bounded time, not just the direct child",
    async () => {
      const child = spawn(process.execPath, [FIXTURE], { stdio: ["ignore", "pipe", "ignore"] })
      const grandchildPid = await readGrandchildPid(child)

      try {
        expect(isProcessAlive(child.pid)).toBe(true)
        expect(isProcessAlive(grandchildPid)).toBe(true)

        await killProcessTree(child.pid)

        const childGone = await waitUntil(() => !isProcessAlive(child.pid), { timeoutMs: 5000 })
        expect(childGone).toBe(true)

        const grandchildGone = await waitUntil(() => !isProcessAlive(grandchildPid), {
          timeoutMs: 5000,
        })
        expect(grandchildGone).toBe(true)
      } finally {
        if (isProcessAlive(child.pid)) await killProcessTree(child.pid)
        if (isProcessAlive(grandchildPid)) await killProcessTree(grandchildPid)
      }
    },
    10_000,
  )
})

// Regression coverage for the Sprint 43 self-heal fix: with per-invocation dynamic ports (see
// the file-level comment in ../run-e2e.mjs), a run that never got a chance to clean up after
// itself - e.g. a human force-killing a hung run via Task Manager or PowerShell's `Stop-Process`,
// neither of which delivers a signal Node can catch - can no longer be found via "whatever's
// listening on the well-known port," because there is no well-known port anymore. `reapStaleRuns`
// is what replaces that: it reads pidfiles left behind in PID_DIR and kills anything still alive
// before the next invocation starts. This test plants a fake stale pidfile pointing at a real,
// still-running process tree (reusing the same fixture as the killProcessTree test above) and
// asserts `reapStaleRuns` kills it and removes the pidfile - i.e. the next `run-e2e.mjs`
// invocation needs no manual pre-run cleanup step even though the previous one never exited
// cleanly.
describe("reapStaleRuns", () => {
  it(
    "kills a leftover process tree from a pidfile left by a run that never cleaned up, and removes the pidfile",
    async () => {
      const child = spawn(process.execPath, [FIXTURE], { stdio: ["ignore", "pipe", "ignore"] })
      const grandchildPid = await readGrandchildPid(child)
      const fakeRunPid = 999_999_000 + Math.floor(Math.random() * 1000) // never a real PID
      fs.mkdirSync(PID_DIR, { recursive: true })
      const stalePidFile = path.join(PID_DIR, `run-${fakeRunPid}.json`)
      fs.writeFileSync(stalePidFile, JSON.stringify({ runPid: fakeRunPid, serverPid: child.pid, testsPid: null }))

      try {
        expect(isProcessAlive(child.pid)).toBe(true)

        await reapStaleRuns()

        const childGone = await waitUntil(() => !isProcessAlive(child.pid), { timeoutMs: 5000 })
        expect(childGone).toBe(true)
        const grandchildGone = await waitUntil(() => !isProcessAlive(grandchildPid), {
          timeoutMs: 5000,
        })
        expect(grandchildGone).toBe(true)
        expect(fs.existsSync(stalePidFile)).toBe(false)
      } finally {
        fs.rmSync(stalePidFile, { force: true })
        if (isProcessAlive(child.pid)) await killProcessTree(child.pid)
        if (isProcessAlive(grandchildPid)) await killProcessTree(grandchildPid)
      }
    },
    10_000,
  )

  it("does nothing when PID_DIR has no stale pidfiles (does not throw)", async () => {
    fs.rmSync(PID_DIR, { recursive: true, force: true })
    await expect(reapStaleRuns()).resolves.toBeUndefined()
  })

  // Regression test for the concurrency bug the Sprint 43 item-1 proof run caught live: two
  // `run-e2e.mjs` invocations started around the same time raced, and the second invocation's
  // `reapStaleRuns` read the first invocation's pidfile, saw its (legitimately still-booting)
  // server PID as "alive," and killed it - because the original implementation only checked
  // serverPid/testsPid liveness, not whether the *owning* run-e2e.mjs process (`runPid`) was
  // still around. A pidfile whose `runPid` is alive belongs to a real concurrent run in progress
  // and must be left completely untouched: not killed, not deleted.
  it(
    "leaves another invocation's pidfile alone when its owning runPid is still alive",
    async () => {
      const child = spawn(process.execPath, [FIXTURE], { stdio: ["ignore", "pipe", "ignore"] })
      const grandchildPid = await readGrandchildPid(child)
      fs.mkdirSync(PID_DIR, { recursive: true })
      // `process.pid` (this test process) stands in for "the owning run-e2e.mjs process is alive."
      const liveOwnerPidFile = path.join(PID_DIR, `run-${process.pid}.json`)
      fs.writeFileSync(liveOwnerPidFile, JSON.stringify({ runPid: process.pid, serverPid: child.pid, testsPid: null }))

      try {
        await reapStaleRuns()

        // Give a wrongly-triggered kill a moment to land before asserting it didn't.
        await new Promise((resolve) => setTimeout(resolve, 500))
        expect(isProcessAlive(child.pid)).toBe(true)
        expect(isProcessAlive(grandchildPid)).toBe(true)
        expect(fs.existsSync(liveOwnerPidFile)).toBe(true)
      } finally {
        fs.rmSync(liveOwnerPidFile, { force: true })
        if (isProcessAlive(child.pid)) await killProcessTree(child.pid)
        if (isProcessAlive(grandchildPid)) await killProcessTree(grandchildPid)
      }
    },
    10_000,
  )
})
