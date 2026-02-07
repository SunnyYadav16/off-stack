-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts USING fts5(
    title,
    code,
    description,
    tags,
    content='snippets',
    content_rowid='rowid'
);

-- Trigger: sync on INSERT
CREATE TRIGGER IF NOT EXISTS snippets_ai AFTER INSERT ON snippets BEGIN
    INSERT INTO snippets_fts(rowid, title, code, description, tags)
    VALUES (NEW.rowid, NEW.title, NEW.code, NEW.description, NEW.tags);
END;

-- Trigger: sync on DELETE
CREATE TRIGGER IF NOT EXISTS snippets_ad AFTER DELETE ON snippets BEGIN
    INSERT INTO snippets_fts(snippets_fts, rowid, title, code, description, tags)
    VALUES('delete', OLD.rowid, OLD.title, OLD.code, OLD.description, OLD.tags);
END;

-- Trigger: sync on UPDATE
CREATE TRIGGER IF NOT EXISTS snippets_au AFTER UPDATE ON snippets BEGIN
    INSERT INTO snippets_fts(snippets_fts, rowid, title, code, description, tags)
    VALUES('delete', OLD.rowid, OLD.title, OLD.code, OLD.description, OLD.tags);
    INSERT INTO snippets_fts(rowid, title, code, description, tags)
    VALUES (NEW.rowid, NEW.title, NEW.code, NEW.description, NEW.tags);
END;
