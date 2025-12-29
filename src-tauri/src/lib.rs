use std::fs;
use std::path::Path;
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
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

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

    // --- macOS 实现 ---
    #[cfg(target_os = "macos")]
    {
        let paths = vec![
            "/Applications",
            "/System/Applications",
            "/System/Applications/Utilities",
        ];
        for folder in paths {
            if let Ok(entries) = fs::read_dir(folder) {
                for entry in entries.flatten() {
                    let path = entry.path();
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
    }

    // --- Windows 实现 ---
    #[cfg(target_os = "windows")]
    {
        // Windows 的应用主要在“开始菜单”的快捷方式里
        // 我们需要扫描两个位置：系统级和用户级
        let mut search_paths = Vec::new();

        // 1. 系统级开始菜单 (C:\ProgramData\Microsoft\Windows\Start Menu\Programs)
        if let Ok(program_data) = std::env::var("ProgramData") {
            search_paths.push(format!(
                r"{}\Microsoft\Windows\Start Menu\Programs",
                program_data
            ));
        }

        // 2. 用户级开始菜单 (%APPDATA%\Microsoft\Windows\Start Menu\Programs)
        if let Ok(app_data) = std::env::var("APPDATA") {
            search_paths.push(format!(
                r"{}\Microsoft\Windows\Start Menu\Programs",
                app_data
            ));
        }

        for folder in search_paths {
            // Windows 需要递归扫描文件夹（因为开始菜单里有很多分类文件夹）
            // 这里写一个简单的辅助函数或直接遍历（为了简洁演示，这里只遍历两层，实际建议使用 `walkdir` crate）
            visit_dirs(Path::new(&folder), &mut apps);
        }
    }

    // 排序
    apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    apps
}

// Windows 专用：简单的递归遍历
#[cfg(target_os = "windows")]
fn visit_dirs(dir: &Path, apps: &mut Vec<AppInfo>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                visit_dirs(&path, apps); // 递归
            } else {
                // 只收集 .lnk (快捷方式)
                if path.extension().map_or(false, |ext| ext == "lnk") {
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
}

// ==================== 2. 启动应用 (跨平台) ====================

#[tauri::command]
fn launch_app(path: String) {
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg(path).spawn();
    }

    #[cfg(target_os = "windows")]
    {
        // Windows 下使用 cmd /c start "" "path"
        // 第一个空字符串是设置窗口标题，防止路径里的空格导致解析错误
        let _ = Command::new("cmd").args(["/C", "start", "", &path]).spawn();
    }
}
