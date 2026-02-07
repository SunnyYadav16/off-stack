interface SnippetEditorProps {
    initialCode?: string;
    language?: string;
    onChange?: (code: string) => void;
}

export function SnippetEditor({ initialCode = "", language = "javascript", onChange }: SnippetEditorProps) {
    return (
        <div className="rounded-lg bg-surface border border-secondary/20 overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 text-sm font-mono">{language}</div>
            <textarea
                className="w-full h-64 p-4 bg-transparent font-mono text-sm resize-none focus:outline-none"
                value={initialCode}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder="Paste your code here..."
            />
        </div>
    );
}
