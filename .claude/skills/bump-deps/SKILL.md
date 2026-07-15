---
name: bump-deps
description: Bump JS/TS dependencies in this monorepo (yarn workspace + deno workspaces) one dependency or scope-group per commit, respecting the rolling age gate, keeping JSR deps on JSR, deduping the lockfile, and gating each commit on `yarn ci:dev`. Use when the user asks to "bump deps", "update dependencies", "upgrade packages", or refresh versions.
---

# Bump Dependencies

A runbook for upgrading JS/TS dependencies in this repo. Two runtime stacks share it:

- **Yarn workspace** — `package.json` (root) + `frontend/package.json`
- **Deno workspaces** — `deno.json` (root), `supabase/functions/api/deno.json`, `scripts/deno.json`

Dependencies are declared in BOTH systems: npm/jsr specifiers in the `package.json`s **and** matching `imports` entries in the `deno.json`s. A bump must update every place a package appears.

## Hard rules (do not violate)

1. **One commit per dependency or scope group.** Group every package under a scope together — `@tanstack`, `@std`, `@supabase` (including scope members that feel distinct like `@supabase/server`). Not one giant commit.
2. **Respect the age gate.** `minimumDependencyAge` in `deno.json` (`P7D`) and `npmMinimalAgeGate` in `.yarnrc.yml` (`7d`). The gate is a **rolling `now − 7d` timestamp**, stricter than end-of-day — yarn and deno will *quarantine* anything published more recently. Compute candidates against `now − 7d` (see below).
3. **JSR stays JSR.** Never swap a `jsr:` specifier to `npm:`. A dep already declared `npm:` (e.g. the frontend's `@supabase/supabase-js`) stays npm.
4. **Yarn itself is a bumpable dependency** — upgrade it with `yarn set version berry` (updates `.yarnrc.yml` `yarnPath`, `.yarn/releases/`, and `packageManager` in `package.json`).
5. **`yarn ci:dev` must pass before every commit.** If a bump breaks it, pin down or skip that bump — don't commit red.

## Step 0 — Branch

Create a branch per [naming convention](../../../CLAUDE.md): `elliott/<topic>` (or `elliott/<ticket>/<topic>`), e.g. `elliott/bump-js-deps`. Confirm baseline `yarn ci:dev` passes first.

## Step 1 — Discover latest versions within the rolling gate

The gate cutoff moves as the session runs. Compute the highest **stable** semver published on or before `now − 7d` (with a small safety margin for clock drift). npm's `time` map is ordered by publish time, not semver, so sort by semver — don't take the last entry.

```sh
cat > /tmp/gate.js <<'EOF'
const d=JSON.parse(require("fs").readFileSync(0,"utf8"));
const gate=new Date(Date.now()-7*24*3600*1000-2*3600*1000); // now-7d minus 2h margin
const cmp=(a,b)=>{a=a.split(".").map(Number);b=b.split(".").map(Number);for(let i=0;i<3;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;};
const stable=Object.entries(d).filter(([k])=>/^\d+\.\d+\.\d+$/.test(k));
const el=stable.filter(([v,t])=>new Date(t)<=gate).map(([v])=>v).sort(cmp);
console.log(el[el.length-1]||"n/a");
EOF
# npm package:
npm view <pkg> time --json | node /tmp/gate.js
# JSR package (query the JSR npm registry; jsr:@scope/name -> @jsr/scope__name):
npm view @jsr/<scope>__<name> time --json --registry=https://npm.jsr.io | node /tmp/gate.js
```

Only bump packages whose gate-latest is newer than the declared floor. Many won't move because their latest release is younger than 7 days — that's expected.

## Step 2 — Per dependency / group, repeat

1. **Edit every declaration site**: the relevant `package.json`(s) AND every `deno.json` `imports` entry (keep the `jsr:`/`npm:` prefix intact).
2. `yarn install` — updates `yarn.lock`.
3. `yarn dedupe` — consolidate duplicate ranges (run on **every** bump, not once at the end).
4. `deno install` — refresh the deno cache / `deno.lock`.
5. `yarn ci:dev` — must pass (`deno check && deno lint && deno test`). This is the gate; root `deno check` typechecks `frontend/` too.
6. **`@hey-api/openapi-ts` bump** — regenerate the client with `yarn pool create-client` and commit the `scripts/client/` changes as part of that bump.
7. **Commit** the touched manifests + `yarn.lock` + `deno.lock` (+ generated client if applicable):

```
chore(deps): bump <pkg> to <version>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

For a scope group, title it `chore(deps): bump @scope packages` and list the members in the body.

## Where each package lives

- `@aws-sdk/client-ses`, `@supabase/server`, `hono`, `@hono/zod-openapi`, `ical-generator`, `zod` → root `package.json` + `supabase/functions/api/deno.json`
- `@supabase/functions-js`, `@supabase/supabase-js`, `@std/encoding`, `@std/uuid`, `@b-fuze/deno-dom` (jsr) → root `package.json` + `supabase/functions/api/deno.json`
- `@hey-api/openapi-ts`, `@cliffy/command`, `@std/dotenv`, `@supabase/supabase-js` (jsr) → root `package.json` + `scripts/deno.json`
- `@std/testing` → root `package.json` + root `deno.json`
- `@std/expect` → root `package.json` only (bare-imported in tests, resolved via node_modules)
- frontend packages (`@mantine/*`, `@tanstack/*`, `react*`, `vite*`, `@supabase/supabase-js` **npm**, `typescript`, …) → `frontend/package.json` only (no `imports` map in `frontend/deno.json`)
- `typescript` → root `package.json` + `frontend/package.json`

## Gotchas

- **Rolling gate quarantine**: if `yarn install` reports "all versions … are quarantined" or `deno install` says "newer than the specified minimum dependency date", the version is too young — drop to the next lower stable release and retry.
- **Don't hand-edit `scripts/client/`** — it's generated by `yarn pool create-client`.
- **Don't edit `frontend/src/routeTree.gen.ts`** — generated by the router plugin.
- **Avoid `git rebase --onto <base> <commit> HEAD`** to reorder/fold commits — passing `HEAD` (a commit, not the branch name) leaves you on a **detached HEAD** and the branch pointer stays behind. Reattach with `git switch -C <branch>` (keeps working-tree changes), or pass the branch name as the rebase target.
- Lockfile churn from a scope bump (e.g. `@supabase` transitive `auth-js`/`postgrest-js`/… moving in lockstep) is expected — verify the `yarn.lock`/`deno.lock` diff only touches that scope before committing.
