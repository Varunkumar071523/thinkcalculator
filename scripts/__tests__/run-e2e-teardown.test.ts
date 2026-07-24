// Regression coverage for the Windows `run-e2e.mjs` teardown hang (see the file-level comment in
// ../run-e2e.mjs and docs/DECISIONS.md). The hang's root cause was structural - Playwright owning
// and trying to signal a server process it can't reliably terminate on Windows - and the fix is
// structural too (never let Playwright own that process). That's not exercised by a unit test.
//
// What *is* unit-testable, and what would silently regress if someone "simplified" `killProcessTree`
// back to a bare `process.kill(pid)`, is the process-TREE part of the fix: on Windows, killing the
// server's PID must also reap anything it spawned, not just the one process. This test builds a
// real 2-level process tree (child + grandchild), asks `killProcessTree` to tear down the child,
// and asserts the whole tree is gone within a bounded time - not just that the call returned.
import { execSync, spawn } from "node:child_process"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { killProcessTree } from "../run-e2e.mjs"

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

        killProcessTree(child.pid)

        const childGone = await waitUntil(() => !isProcessAlive(child.pid), { timeoutMs: 5000 })
        expect(childGone).toBe(true)

        // The tree-kill guarantee (`taskkill /T /F`) only applies on win32 - see the comment on
        // killProcessTree in run-e2e.mjs. On POSIX, the script only ever kills a single directly
        // spawned `next start` process with no shell/grandchild layer in between, so a plain
        // SIGKILL of the immediate PID is the correct and complete contract there.
        if (process.platform === "win32") {
          const grandchildGone = await waitUntil(() => !isProcessAlive(grandchildPid), {
            timeoutMs: 5000,
          })
          expect(grandchildGone).toBe(true)
        }
      } finally {
        if (isProcessAlive(child.pid)) killProcessTree(child.pid)
        if (isProcessAlive(grandchildPid)) killProcessTree(grandchildPid)
      }
    },
    10_000,
  )
})
