-- Trigger function for automatically updating the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Projects --
CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    started_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, name)
);
CREATE TRIGGER update_projects_modtime BEFORE
UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TABLE IF NOT EXISTS activities (
    activity_id SERIAL PRIMARY KEY,
    project_id SERIAL NOT NULL,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (project_id) REFERENCES projects (project_id) ON DELETE CASCADE
);
CREATE TRIGGER update_activities_modtime BEFORE
UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_modified_column();
-- Worktime --
CREATE TABLE IF NOT EXISTS worktime (
    user_id TEXT NOT NULL,
    day TIMESTAMP NOT NULL,
    work_time INTEGER NOT NULL,
    break_time INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, day)
);
CREATE TRIGGER update_worktime_modtime BEFORE
UPDATE ON worktime FOR EACH ROW EXECUTE FUNCTION update_modified_column();