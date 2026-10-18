# TimeTrack

Time tracking for projects. `backend/pkg/` is a Go REST API on Postgres (schema in
`backend/database/init_database.sql`), `frontend/` a React + TypeScript app built with Vite. Login
goes through OIDC; `compose.yaml` runs the whole dev stack including Dex as the provider
(`backend/docker/dex/`, static users, no login session and no logout endpoint).

## Checks

- `task check`: everything below; CI runs it on merge requests and on `main`.
- `task be:lint` / `be:build` / `be:test`: `go vet`, `go build`, `go test` in `backend/pkg/`.
- `task fe:lint` / `fe:build`: ESLint (no warnings allowed), `tsc` and the Vite build.
- `task be:security` / `fe:security`: `govulncheck` and `npm audit --omit=dev`. Any finding fails the
  check; fix it (or have it fixed in a separate MR first). No other security tooling for now.
- `task up`: the dev stack (`docker compose`).
- `task test:e2e`: Playwright tests in `e2e/` against the whole stack (`compose.yaml` plus
  `compose.e2e.yaml`: no mounts, service-name URLs, Dex test users from `config.e2e.yaml`). Needs
  docker; CI runs it as the `e2e` job. Not part of `task check`.

## Releasing

Every merge to `main` is a release: its pipeline checks, builds the images as
`<date>-<pipeline>` and `:latest`, and records a GitLab release `deploy-<version>` with the merged
MRs (`ci/release-notes.sh`). No tags by hand; to roll back, revert on `main`.

## Tests

- End-to-end tests (`e2e/`) cover every user feature including the SQL, the one-active-project rule and
  user isolation. They create their own uniquely named data (no database reset), so new tests must too.
- Unit tests (`task be:test`, frontend tests) cover logic that can break, without database or
  other services; no tests for coverage, mappings or what only restates the code.
- Logic worth testing that is tangled with SQL, HTTP or components gets pulled out into plain
  functions (small, behaviour-preserving refactorings). Database access and whole flows are left
  to the end-to-end tests.

## Done

A change is done when `task check` is green, new logic has unit tests, new user features have e2e
tests (type-checked with `npm run lint` in `e2e/` when changed) and nothing outside the scope of the
issue was changed. When `ci/check/Dockerfile` changes, raise `CHECK_IMAGE_REV` in `.gitlab-ci.yml`.

## Automated agent runs

When you run as the GitLab agent (implementing an issue in CI, not in a session with the user):

- The design discussion already happened: the issue was judged clear enough, or its plan was
  approved. Implement it; don't stop to ask.
- You run in the CI check image (Go, Node, `task`), without Postgres or Dex. Run the checks
  above for what you change; never `task up` or `task test:e2e` (no docker; the MR pipeline's `e2e` job
  runs them). Type-check e2e changes with `npm run lint` in `e2e/`.
