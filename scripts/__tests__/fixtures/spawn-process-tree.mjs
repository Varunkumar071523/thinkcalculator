// Test fixture only - not part of the runtime script. Spawned by
// scripts/__tests__/run-e2e-teardown.test.ts to stand in for "a dev-server process with a
// grandchild of its own" (the shape of tree `next start`/Playwright can produce), without
// depending on Next.js or Playwright actually being installed/running.
//
// The grandchild is spawned `detached: true` deliberately: on Windows, Node puts non-detached
// children in the same job object as their spawning process, and terminating that process alone
// (however you terminate it) cascades to non-detached descendants for free via job-object
// teardown - which would make this fixture pass even against a naive, non-tree-aware kill and
// prove nothing. A `detached: true` grandchild breaks that job-object membership, so it only gets
// reaped if the killer walks the real Windows process tree (`taskkill /T`), which is exactly the
// behavior this test exists to pin down.
//
// Prints `GRANDCHILD_PID=<pid>` once its own child is spawned, then both this process and its
// child idle forever (until killed) so the test can assert on tearing down the whole tree.
import { spawn } from "node:child_process"
import process from "node:process"

const grandchild = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
  stdio: "ignore",
  detached: true,
})
grandchild.unref()

console.log(`GRANDCHILD_PID=${grandchild.pid}`)

setInterval(() => {}, 1000)
