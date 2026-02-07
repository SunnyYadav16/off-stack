export interface Snippet {
    id: string;
    title: string;
    code: string;
    language: string;
    description?: string;
    tags?: string[];
    folderId?: string;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSnippetInput {
    title: string;
    code: string;
    language: string;
    description?: string;
    tags?: string[];
    folderId?: string;
}

export interface UpdateSnippetInput {
    title?: string;
    code?: string;
    language?: string;
    description?: string;
    tags?: string[];
    folderId?: string;
    isFavorite?: boolean;
}
