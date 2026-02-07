import { useState, useCallback } from "react";
import type { Snippet } from "../types/snippet";

export function useDatabase() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getSnippets = useCallback(async (): Promise<Snippet[]> => {
        setLoading(true);
        setError(null);
        try {
            // TODO: Implement with tauri-plugin-sql
            return [];
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load snippets");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const searchSnippets = useCallback(async (query: string): Promise<Snippet[]> => {
        setLoading(true);
        setError(null);
        try {
            // TODO: Implement FTS5 search with tauri-plugin-sql
            console.log("Search query:", query);
            return [];
        } catch (err) {
            setError(err instanceof Error ? err.message : "Search failed");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, getSnippets, searchSnippets };
}
