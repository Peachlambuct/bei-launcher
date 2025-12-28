use std::process::Command;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // 创建托盘菜单项
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_i])?;

            // 构建托盘
            let _tray = TrayIconBuilder::with_id("tray")
                .icon(app.default_window_icon().unwrap().clone()) // 使用默认图标
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        ..
                    } = event
                    {
                        // 获取主窗口
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![launch_app, get_system_apps])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(serde::Serialize, Clone)]
struct AppInfo {
    name: String,
    path: String,
    // 图标提取比较复杂，暂且前端统一用通用图标，或者后续进阶再做
}

#[tauri::command]
fn get_system_apps() -> Vec<AppInfo> {
    let mut apps = Vec::new();
    // macOS 常见的应用目录
    let paths = vec![
        "/Applications",
        "/System/Applications",
        "/System/Applications/Utilities",
    ];

    for folder in paths {
        if let Ok(entries) = std::fs::read_dir(folder) {
            for entry in entries.flatten() {
                let path = entry.path();
                // 只保留 .app 结尾的目录
                if path.is_dir() && path.extension().map_or(false, |ext| ext == "app") {
                    if let Some(stem) = path.file_stem() {
                        apps.push(AppInfo {
                            name: stem.to_string_lossy().to_string(),
                            path: path.to_string_lossy().to_string(),
                        });
                    }
                }
            }
        }
    }
    // 简单排个序
    apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    apps
}

#[tauri::command]
fn launch_app(path: String) {
    // 使用 macOS 的 `open` 命令
    let _ = Command::new("open").arg(path).spawn();
}
