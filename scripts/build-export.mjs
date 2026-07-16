// Runs `next build` with STATIC_EXPORT=true so next.config.ts switches to output: 'export'.
// A dedicated script (rather than inline `VAR=value next build` in package.json) because that
// shell syntax does not work on Windows cmd.exe, which is what npm scripts run under by default
// there; spawning as a child process with an explicit env object works the same on every OS.
import { spawnSync } from "node:child_process"

const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, STATIC_EXPORT: "true" },
})

process.exit(result.status ?? 1)
