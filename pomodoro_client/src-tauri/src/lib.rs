// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn toggle_pip_window(app: tauri::AppHandle, show: bool) -> Result<(), String> {
    if let Some(pip_window) = app.get_webview_window("pip") {
        if show {
            pip_window.show().map_err(|e: tauri::Error| e.to_string())?;
            pip_window
                .set_focus()
                .map_err(|e: tauri::Error| e.to_string())?;
        } else {
            pip_window.hide().map_err(|e: tauri::Error| e.to_string())?;
        }
    } else {
        return Err("PIP window not found".to_string());
    }
    Ok(())
}

#[tauri::command]
async fn is_pip_window_open(app: tauri::AppHandle) -> Result<bool, String> {
    if let Some(pip_window) = app.get_webview_window("pip") {
        pip_window
            .is_visible()
            .map_err(|e: tauri::Error| e.to_string())
    } else {
        Ok(false)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            toggle_pip_window,
            is_pip_window_open
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
