CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name varchar(50) NOT NULL UNIQUE,
    started_at TIMESTAMP,
    runtime bigint NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- Add trigger function for automatically updating the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger on projects table
CREATE TRIGGER update_projects_modtime BEFORE
UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_modified_column();