CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name varchar(50) NOT NULL UNIQUE,
    started_at TIMESTAMP,
    runtime bigint NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);