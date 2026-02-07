import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import "./index.css";
import type { CapturePayload } from "./types/capture";

function App() {
    const [lastCapture, setLastCapture] = useState<CapturePayload | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Listen for snippet-captured events from Rust backend
        const unlistenCapture = listen<CapturePayload>("snippet-captured", (event) => {
            console.log("Snippet captured:", event.payload);
            setLastCapture(event.payload);
            setError(null);
        });

        const unlistenError = listen<string>("snippet-capture-error", (event) => {
            console.error("Capture error:", event.payload);
            setError(event.payload);
        });

        return () => {
            unlistenCapture.then((fn) => fn());
            unlistenError.then((fn) => fn());
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
            <div className="text-center mb-8">
                <h1 className="text-5xl font-bold text-primary mb-4">OffStack</h1>
                <p className="text-lg text-secondary">Your code snippet manager</p>
                <p className="text-sm text-secondary/70 mt-2">
                    Press <kbd className="px-2 py-1 bg-surface rounded text-xs font-mono">⌘+Option+S</kbd> (macOS) or <kbd className="px-2 py-1 bg-surface rounded text-xs font-mono">Ctrl+Alt+S</kbd> to capture
                </p>
            </div>

            {error && (
                <div className="w-full max-w-2xl p-4 rounded-lg bg-red-100 text-red-800 mb-4">
                    <p className="font-medium">Capture failed</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {lastCapture && (
                <div className="w-full max-w-2xl p-4 rounded-lg bg-surface shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${lastCapture.is_code ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'
                            }`}>
                            {lastCapture.is_code ? 'Code' : 'Text'}
                        </span>
                        {lastCapture.source_app && (
                            <span className="text-xs text-secondary">{lastCapture.source_app}</span>
                        )}
                    </div>
                    <pre className="p-4 rounded bg-background overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                        {lastCapture.text}
                    </pre>
                    <div className="mt-3 flex justify-between text-xs text-secondary/70">
                        <span>{lastCapture.platform}</span>
                        <span>{new Date(lastCapture.timestamp).toLocaleTimeString()}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
