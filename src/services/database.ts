import Database from "@tauri-apps/plugin-sql";
import type { Snippet, CreateSnippetInput, UpdateSnippetInput } from "../types/snippet";

const DB_NAME = "sqlite:offstack.db";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
    if (!db) {
        db = await Database.load(DB_NAME);
    }
    return db;
}

function generateId(): string {
    return crypto.randomUUID();
}

function now(): string {
    return new Date().toISOString();
}

export async function createSnippet(input: CreateSnippetInput): Promise<Snippet> {
    const database = await getDb();
    const id = generateId();
    const timestamp = now();

    await database.execute(
        `INSERT INTO snippets (id, title, code, language, description, tags, folder_id, is_favorite, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
            id,
            input.title,
            input.code,
            input.language,
            input.description || null,
            input.tags ? JSON.stringify(input.tags) : null,
            input.folderId || null,
            0,
            timestamp,
            timestamp,
        ]
    );

    return {
        id,
        title: input.title,
        code: input.code,
        language: input.language,
        description: input.description,
        tags: input.tags,
        folderId: input.folderId,
        isFavorite: false,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
}

export async function updateSnippet(id: string, input: UpdateSnippetInput): Promise<void> {
    const database = await getDb();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
        fields.push(`title = $${paramIndex++}`);
        values.push(input.title);
    }
    if (input.code !== undefined) {
        fields.push(`code = $${paramIndex++}`);
        values.push(input.code);
    }
    if (input.language !== undefined) {
        fields.push(`language = $${paramIndex++}`);
        values.push(input.language);
    }
    if (input.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(input.description);
    }
    if (input.tags !== undefined) {
        fields.push(`tags = $${paramIndex++}`);
        values.push(JSON.stringify(input.tags));
    }
    if (input.folderId !== undefined) {
        fields.push(`folder_id = $${paramIndex++}`);
        values.push(input.folderId);
    }
    if (input.isFavorite !== undefined) {
        fields.push(`is_favorite = $${paramIndex++}`);
        values.push(input.isFavorite ? 1 : 0);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(now());
    values.push(id);

    await database.execute(
        `UPDATE snippets SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
        values
    );
}

export async function deleteSnippet(id: string): Promise<void> {
    const database = await getDb();
    await database.execute("DELETE FROM snippets WHERE id = $1", [id]);
}

export async function getSnippetById(id: string): Promise<Snippet | null> {
    const database = await getDb();
    const result = await database.select<Snippet[]>(
        "SELECT * FROM snippets WHERE id = $1",
        [id]
    );
    return result.length > 0 ? mapSnippet(result[0]) : null;
}

export async function listSnippets(page = 1, limit = 20): Promise<Snippet[]> {
    const database = await getDb();
    const offset = (page - 1) * limit;
    const result = await database.select<Snippet[]>(
        "SELECT * FROM snippets ORDER BY updated_at DESC LIMIT $1 OFFSET $2",
        [limit, offset]
    );
    return result.map(mapSnippet);
}

export async function searchSnippets(query: string): Promise<Snippet[]> {
    const database = await getDb();
    const result = await database.select<Snippet[]>(
        `SELECT s.* FROM snippets s
     JOIN snippets_fts fts ON s.rowid = fts.rowid
     WHERE snippets_fts MATCH $1
     ORDER BY rank`,
        [query]
    );
    return result.map(mapSnippet);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSnippet(row: any): Snippet {
    return {
        id: row.id,
        title: row.title,
        code: row.code,
        language: row.language,
        description: row.description,
        tags: row.tags ? JSON.parse(row.tags) : undefined,
        folderId: row.folder_id,
        isFavorite: Boolean(row.is_favorite),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
