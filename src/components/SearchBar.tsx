interface SearchBarProps {
    placeholder?: string;
    onSearch?: (query: string) => void;
}

export function SearchBar({ placeholder = "Search snippets...", onSearch }: SearchBarProps) {
    return (
        <input
            type="text"
            placeholder={placeholder}
            className="w-full px-4 py-2 rounded-lg bg-surface border border-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => onSearch?.(e.target.value)}
        />
    );
}
