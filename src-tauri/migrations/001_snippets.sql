-- Snippets table
CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    description TEXT,
    tags TEXT,
    folder_id TEXT,
    is_favorite INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_folder ON snippets(folder_id);
CREATE INDEX IF NOT EXISTS idx_snippets_favorite ON snippets(is_favorite);
