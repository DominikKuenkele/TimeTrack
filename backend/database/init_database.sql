CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name varchar(50) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS tracking (
    id SERIAL PRIMARY KEY,
    project_id SERIAL NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);