import type { Snippet } from "../types/snippet";

interface SnippetCardProps {
    snippet: Snippet;
    onClick?: () => void;
}

export function SnippetCard({ snippet, onClick }: SnippetCardProps) {
    return (
        <div
            className="p-4 rounded-lg bg-surface hover:bg-surface/80 cursor-pointer transition-colors"
            onClick={onClick}
        >
            <h3 className="font-semibold text-lg">{snippet.title}</h3>
            <p className="text-sm text-secondary mt-1">{snippet.language}</p>
            {snippet.description && (
                <p className="text-sm text-gray-500 mt-2">{snippet.description}</p>
            )}
        </div>
    );
}
