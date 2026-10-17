# TimeTrack

Time tracking for projects. `backend/pkg/` is a Go REST API on Postgres (schema in
`backend/database/init_database.sql`), `frontend/` a React + TypeScript app built with Vite. Login
goes through Authentik (OIDC); `compose.yaml` runs the whole dev stack including Authentik.

## Checks

- `task check`: everything below; CI runs it on merge requests and builds the images on tags.
- `task be:lint` / `be:build` / `be:test`: `go vet`, `go build`, `go test` in `backend/pkg/`.
- `task fe:lint` / `fe:build`: ESLint (no warnings allowed), `tsc` and the Vite build.
- `task up`: the dev stack (`docker compose`).

## Automated agent runs

When you run as the GitLab agent (implementing an issue in CI, not in a session with the user):

- The design discussion already happened: the issue was judged clear enough, or its plan was
  approved. Implement it; don't stop to ask.
- You run in the CI check image (Go, Node, `task`), without Postgres or Authentik. Run the checks
  above for what you change; never `task up`.
