mod clipboard;
pub mod db;
pub mod ai;
pub mod utils;

use tauri::Emitter;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_snippets_table",
            sql: include_str!("../migrations/001_snippets.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_fts5_table",
            sql: include_str!("../migrations/002_fts5.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_complexity_fields",
            sql: include_str!("../migrations/003_add_complexity_fields.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:offstack.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            #[cfg(desktop)]
            {
                // Platform-specific shortcut configuration
                // macOS: Cmd + Option + S
                // Windows/Linux: Ctrl + Alt + S
                #[cfg(target_os = "macos")]
                let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::ALT), Code::KeyS);

                #[cfg(not(target_os = "macos"))]
                let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyS);

                let app_handle = app.handle().clone();
                let dialog_handle = app.handle().clone();
                
                // Set up the handler
                if let Err(e) = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        let hotkey_name = if cfg!(target_os = "macos") { "Cmd+Option+S" } else { "Ctrl+Alt+S" };
                        println!("Global shortcut triggered: {}", hotkey_name);
                        
                        match clipboard::capture_selection() {
                            Ok(payload) => {
                                println!("Captured text: {} chars, is_code: {}", payload.text.len(), payload.is_code);
                                if let Err(e) = app_handle.emit("snippet-captured", &payload) {
                                    eprintln!("Failed to emit event: {}", e);
                                }
                            }
                            Err(e) => {
                                eprintln!("Capture failed: {}", e);
                                let _ = app_handle.emit("snippet-capture-error", e);
                            }
                        }
                    }
                }) {
                    eprintln!("Failed to set shortcut handler: {}", e);
                }
                
                // Try to register the shortcut
                match app.global_shortcut().register(shortcut) {
                    Ok(_) => {
                        let hotkey_name = if cfg!(target_os = "macos") { "Cmd+Option+S" } else { "Ctrl+Alt+S" };
                        println!("Registered global shortcut: {}", hotkey_name);
                    }
                    Err(e) => {
                        let hotkey_name = if cfg!(target_os = "macos") { "Cmd+Option+S" } else { "Ctrl+Alt+S" };
                        eprintln!("Failed to register global shortcut ({}): {}", hotkey_name, e);
                        
                        // Show dialog to user
                        dialog_handle.dialog()
                            .message(format!("Global Hotkey Failed ({})", hotkey_name))
                            .title("Permission Required or Conflict")
                            .kind(MessageDialogKind::Warning)
                            .buttons(MessageDialogButtons::OkCancelCustom("Open Settings".to_string(), "Ignore".to_string()))
                            .show(move |result| {
                                if result == true {
                                    #[cfg(target_os = "macos")]
                                    {
                                        let _ = std::process::Command::new("open")
                                            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
                                            .output();
                                    }
                                }
                            });
                    }
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
