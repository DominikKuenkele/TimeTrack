CREATE TYPE status AS ENUM ('started', 'stopped');
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name varchar(50) NOT NULL UNIQUE,
    status status NOT NULL DEFAULT 'stopped',
    started_at TIMESTAMP,
    runtime bigint NOT NULL DEFAULT 0
);