use std::fs;

use tauri::Manager;
use tauri_plugin_deep_link::DeepLinkExt;
use uuid::Uuid;

fn get_or_create_device_id(app: &tauri::AppHandle) -> String {
    let base_dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::env::temp_dir().join("alazab-review"));
    let _ = fs::create_dir_all(&base_dir);

    let file_path = base_dir.join("device-id.txt");

    if let Ok(value) = fs::read_to_string(&file_path) {
        let value = value.trim();
        if Uuid::parse_str(value).is_ok() {
            return value.to_owned();
        }
    }

    let device_id = Uuid::new_v4().to_string();
    let _ = fs::write(file_path, &device_id);
    device_id
}

fn open_share_link(app: &tauri::AppHandle, url: &tauri::Url) {
    if url.scheme() != "alazab" || url.host_str() != Some("share") {
        return;
    }

    let token = url.path().trim_matches('/');
    if token.len() != 64 || !token.chars().all(|c| c.is_ascii_hexdigit()) {
        return;
    }

    let device_id = get_or_create_device_id(app);
    let target = format!(
        "https://alazab.com/receipts?share={token}&device={device_id}&client=desktop"
    );

    let Ok(target_url) = target.parse::<tauri::Url>() else {
        return;
    };

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.navigate(target_url);
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn main() {
    let mut builder = tauri::Builder::default();

    #[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(
            |_app, _argv, _cwd| {
                // Deep-link events are forwarded by the plugin to the running instance.
            },
        ));
    }

    builder
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            #[cfg(target_os = "windows")]
            app.deep_link().register_all()?;

            let app_handle = app.handle().clone();

            if let Some(urls) = app.deep_link().get_current()? {
                for url in urls {
                    open_share_link(&app_handle, &url);
                }
            }

            let event_handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                for url in event.urls() {
                    open_share_link(&event_handle, &url);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run Alazab Review");
}
