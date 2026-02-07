-- Add complexity fields and source_app to snippets table
ALTER TABLE snippets ADD COLUMN time_complexity TEXT;
ALTER TABLE snippets ADD COLUMN space_complexity TEXT;
ALTER TABLE snippets ADD COLUMN source_app TEXT;

-- Verify if folder_id is needed, if not we could drop it, but SQLite doesn't support DROP COLUMN easily in older versions.
-- We will leave it for now as it might be useful for organization.
