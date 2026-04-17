-- Migration: remove local username/password auth tables now that all
-- authentication is handled by Authentik via OIDC.
--
-- projects and worktime previously referenced users(user_id) via foreign key.
-- The user_id column is kept — it now stores the OIDC subject directly.

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE worktime DROP CONSTRAINT IF EXISTS worktime_user_id_fkey;

DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
