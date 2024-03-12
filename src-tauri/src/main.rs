// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Cursor;
use base64::Engine;
use base64::engine::general_purpose;
use image::codecs::jpeg::JpegEncoder;
use image::ImageFormat;


use tauri::api::dialog::blocking::FileDialogBuilder;
use tauri::Manager;

#[derive(Clone, serde::Serialize)]
struct Payload {
    message: String,
}

type SelectedImageTuple = (String, String);
#[tauri::command]
async fn open_image_dialog(app_handle: tauri::AppHandle) -> anyhow::Result<SelectedImageTuple, String> {
    match open_image() {
        Ok(t) => Ok(t),
        Err(error) => {
            app_handle.emit_all("error", Payload { message: "Error opening file.".to_string() }).unwrap();
            Err(error)
        }
    }
}

fn open_image() -> anyhow::Result<SelectedImageTuple, String> {
    // pick image, check string, turn into DynamicImage
    let path_buf = FileDialogBuilder::new().pick_file().ok_or("Cannot open file.".to_string())?;
    let path_string = path_buf.to_str().ok_or("Cannot convert path to string.".to_string())?;
    let image = image::open(path_string).expect("Cannot load image from file");

    // create preview, into png, into bytes, into base64
    let preview_thumbnail = image.thumbnail(100, 100);
    let mut preview_buf: Cursor<Vec<u8>> = Cursor::new(Vec::new());
    preview_thumbnail.write_to(&mut preview_buf, ImageFormat::Png).expect("Cannot write image to buffer");

    let preview_datasrc = format!(
        "data:image/png;base64,{}",
        general_purpose::STANDARD.encode(preview_buf.get_ref())
    );
    let path = path_string.to_string();

    Ok((path, preview_datasrc))
}
#[tauri::command]
async fn convert_file_to_jpeg (app_handle: tauri::AppHandle, path: String, quality: u8) -> anyhow::Result<String, String> {
    match {
        let og_image = image::open(&path).expect("Cannot load image from file");

        let mut jpeg_buf: Cursor<Vec<u8>> = Cursor::new(Vec::new());
        app_handle.emit_all("status", Payload { message: "Converting...".to_string() }).unwrap();
        og_image.write_with_encoder(JpegEncoder::new_with_quality(&mut jpeg_buf, quality)).map_err(|_| "Cannot write image to buffer".to_string())?;
        let jpeg = image::load_from_memory(&jpeg_buf.get_ref()).map_err(|_| "Cannot load jpeg from buffer")?;

        let save_path = FileDialogBuilder::new().save_file().ok_or("Cannot pick save file path.".to_string())?;
        app_handle.emit_all("status", Payload { message: "Saving...".to_string() }).unwrap();
        jpeg.save(save_path).map_err(|_| "Cannot save jpeg to file")?;

        let datasrc: String = format!(
            "data:image/jpeg;base64,{}",
            general_purpose::STANDARD.encode(jpeg_buf.get_ref())
        );
        app_handle.emit_all("status", Payload { message: "Done.".to_string() }).unwrap();

        let result: Result<String, String> = Ok(datasrc);
        result
    } {
        Ok(t) => Ok(t),
        Err(error) => {
            println!("Error during save. {}", error);
            app_handle.emit_all("error", Payload { message: format!("Error during save. {}", error) }).unwrap();
            Err(error)
        }
    }
}

fn main() {

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_image_dialog, convert_file_to_jpeg])
        .run(tauri::generate_context!())
        .map_err(|_| "error while running tauri application");
}
