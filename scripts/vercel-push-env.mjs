/**
 * Reads `.env.local` and pushes each variable to Vercel (production).
 * using the CLI. Requires: `npx vercel link` (and login) first.
 *
 * - Uses stdin for values (safe for URLs with & etc.).
 * - Marks secrets with `--sensitive`.
 * - Sets NEXT_PUBLIC_APP_URL to https://<projectName>.vercel.app when it is localhost.
 * - Ensures SESSION_SECRET exists (generates if missing); min 16 chars required in production.
 */
import { spawnSync } from "node:child_process"
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const ENV_FILE = path.join(ROOT, ".env.local")
const PROJECT_FILE = path.join(ROOT, ".vercel", "project.json")

const SENSITIVE_KEYS = new Set([
  "DATABASE_URL",
  "DIRECT_URL",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_API_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "SESSION_SECRET",
])

/** Preview requires a git branch in non-interactive mode; production is enough for go-live. */
const TARGET_ENVS = ["production"]

function parseEnvFile(content) {
  /** @type {Record<string, string>} */
  const out = {}
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const i = t.indexOf("=")
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    out[k] = v
  }
  return out
}

function readProjectName() {
  if (!fs.existsSync(PROJECT_FILE)) {
    throw new Error("Missing .vercel/project.json — run: npx vercel link --yes --scope <team>")
  }
  const j = JSON.parse(fs.readFileSync(PROJECT_FILE, "utf8"))
  if (!j.projectName) throw new Error(".vercel/project.json has no projectName")
  return String(j.projectName)
}

/**
 * @param {string} key
 * @param {string} value
 * @param {"production" | "preview"} target
 * @param {{ sensitive?: boolean }} opts
 */
function vercelEnvAdd(key, value, target, opts = {}) {
  const args = ["vercel", "env", "add", key, target, "--yes", "--force"]
  if (opts.sensitive) args.push("--sensitive")
  const input = value.endsWith("\n") ? value : `${value}\n`
  const r = spawnSync("npx", args, {
    cwd: ROOT,
    input,
    encoding: "utf8",
    shell: true,
  })
  if (r.error) throw r.error
  if (r.status !== 0) {
    process.stderr.write(r.stdout ?? "")
    process.stderr.write(r.stderr ?? "")
    throw new Error(`vercel env add ${key} ${target} exited ${r.status}`)
  }
}

function main() {
  if (!fs.existsSync(ENV_FILE)) {
    throw new Error(`Missing ${ENV_FILE}`)
  }
  const raw = fs.readFileSync(ENV_FILE, "utf8")
  const env = parseEnvFile(raw)
  const hadSession =
    Boolean(env.SESSION_SECRET) && env.SESSION_SECRET.length >= 16
  const projectName = readProjectName()
  const publicUrl = `https://${projectName}.vercel.app`

  if (!hadSession) {
    env.SESSION_SECRET = crypto.randomBytes(32).toString("hex")
    fs.appendFileSync(
      ENV_FILE,
      `\nSESSION_SECRET=${env.SESSION_SECRET}\n`,
      "utf8"
    )
    console.log(
      "Generated SESSION_SECRET and appended to .env.local (required for production)."
    )
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim() || ""
  if (!appUrl || appUrl.includes("localhost")) {
    env.NEXT_PUBLIC_APP_URL = publicUrl
    console.log(`NEXT_PUBLIC_APP_URL → ${publicUrl} (was localhost or empty)`)
  }

  const keys = Object.keys(env).sort()
  for (const key of keys) {
    const value = env[key]
    if (value === undefined || value === "") {
      console.warn(`Skip empty: ${key}`)
      continue
    }
    const sensitive = SENSITIVE_KEYS.has(key)
    for (const target of TARGET_ENVS) {
      console.log(`Pushing ${key} → ${target}${sensitive ? " (sensitive)" : ""}`)
      vercelEnvAdd(key, value, target, { sensitive })
    }
  }

  console.log("\nDone.")
}

main()
