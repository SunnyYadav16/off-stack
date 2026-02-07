use serde::Serialize;
use chrono::Utc;

/// Payload emitted when text is captured via hotkey
#[derive(Debug, Clone, Serialize)]
pub struct CapturePayload {
    pub text: String,
    pub is_code: bool,
    pub source_app: Option<String>,
    pub timestamp: String,
    pub platform: String,
}

/// Keywords commonly found in code
const CODE_KEYWORDS: &[&str] = &[
    "function", "class", "def", "import", "export", "const", "let", "var",
    "return", "if", "else", "for", "while", "fn", "pub", "struct", "enum",
    "interface", "type", "async", "await", "try", "catch", "throw", "new",
    "extends", "implements", "package", "use", "mod", "impl", "trait",
];

/// Detect if text appears to be code using heuristics
pub fn is_likely_code(text: &str) -> bool {
    if text.trim().is_empty() {
        return false;
    }

    let mut score = 0;

    // Check for brackets
    if text.contains('{') && text.contains('}') {
        score += 2;
    }
    if text.contains('(') && text.contains(')') {
        score += 1;
    }
    if text.contains('[') && text.contains(']') {
        score += 1;
    }

    // Check for semicolons (common in many languages)
    if text.contains(';') {
        score += 1;
    }

    // Check for arrows (lambdas, function arrows)
    if text.contains("=>") || text.contains("->") {
        score += 2;
    }

    // Check for common operators
    if text.contains("===") || text.contains("!==") || text.contains("&&") || text.contains("||") {
        score += 1;
    }

    // Check for code keywords
    let lower = text.to_lowercase();
    for keyword in CODE_KEYWORDS {
        // Match whole words only
        if lower.contains(&format!("{} ", keyword)) 
            || lower.contains(&format!(" {}", keyword))
            || lower.starts_with(keyword) {
            score += 2;
            break;
        }
    }

    // Multi-line with indentation suggests code
    let lines: Vec<&str> = text.lines().collect();
    if lines.len() > 1 {
        let indented_lines = lines.iter()
            .filter(|l| l.starts_with("  ") || l.starts_with("\t"))
            .count();
        if indented_lines > 0 {
            score += 2;
        }
    }

    // Comments
    if text.contains("//") || text.contains("/*") || text.contains("#!") {
        score += 1;
    }

    score >= 3
}

/// Get the current platform identifier
pub fn get_platform() -> String {
    #[cfg(target_os = "macos")]
    return "macos".to_string();
    
    #[cfg(target_os = "windows")]
    return "windows".to_string();
    
    #[cfg(target_os = "linux")]
    return "linux".to_string();
    
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    return "unknown".to_string();
}

/// Get the currently focused application name (macOS)
#[cfg(target_os = "macos")]
pub fn get_active_app() -> Option<String> {
    use std::process::Command;
    
    // Use osascript to get the frontmost application name
    let output = Command::new("osascript")
        .args(["-e", "tell application \"System Events\" to get name of first process whose frontmost is true"])
        .output()
        .ok()?;
    
    if output.status.success() {
        let name = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !name.is_empty() {
            return Some(name);
        }
    }
    None
}

#[cfg(not(target_os = "macos"))]
pub fn get_active_app() -> Option<String> {
    // TODO: Implement for Windows/Linux
    None
}

/// Get selected text from the frontmost application (macOS)
/// This uses Accessibility APIs via osascript
#[cfg(target_os = "macos")]
pub fn get_selected_text() -> Option<String> {
    use std::process::Command;
    
    // First, try simulating Cmd+C and reading clipboard
    // This is more reliable than accessibility in many cases
    let _ = Command::new("osascript")
        .args(["-e", r#"
            tell application "System Events"
                keystroke "c" using command down
            end tell
        "#])
        .output();
    
    // Small delay to let clipboard update
    std::thread::sleep(std::time::Duration::from_millis(100));
    
    // Read from clipboard using pbpaste
    let output = Command::new("pbpaste")
        .output()
        .ok()?;
    
    if output.status.success() {
        let text = String::from_utf8_lossy(&output.stdout).to_string();
        if !text.trim().is_empty() {
            return Some(text);
        }
    }
    
    None
}

#[cfg(not(target_os = "macos"))]
pub fn get_selected_text() -> Option<String> {
    // TODO: Implement for Windows/Linux using their respective APIs
    None
}

/// Capture the current selection and build payload
pub fn capture_selection() -> Result<CapturePayload, String> {
    let text = get_selected_text()
        .ok_or_else(|| "No text selected or clipboard is empty".to_string())?;
    
    if text.trim().is_empty() {
        return Err("Selected text is empty".to_string());
    }

    let is_code = is_likely_code(&text);
    let source_app = get_active_app();
    let timestamp = Utc::now().to_rfc3339();
    let platform = get_platform();

    Ok(CapturePayload {
        text,
        is_code,
        source_app,
        timestamp,
        platform,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_likely_code_javascript() {
        let code = r#"function hello() {
    console.log("Hello, World!");
}"#;
        assert!(is_likely_code(code));
    }

    #[test]
    fn test_is_likely_code_rust() {
        let code = r#"fn main() {
    println!("Hello");
}"#;
        assert!(is_likely_code(code));
    }

    #[test]
    fn test_is_likely_code_plain_text() {
        let text = "This is just a regular sentence without any code.";
        assert!(!is_likely_code(text));
    }

    #[test]
    fn test_is_likely_code_python() {
        let code = r#"def hello():
    print("Hello")
    return True"#;
        assert!(is_likely_code(code));
    }
}
