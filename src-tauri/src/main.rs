// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Cursor;
use base64::Engine;
use base64::engine::general_purpose;

fn data_src_to_img(data_src: &str) -> anyhow::Result<image::DynamicImage, String> {
    let byte_array = general_purpose::STANDARD.decode(data_src).expect("data_src_to_img: Cannot decode png data");
    let img = image::load_from_memory(&byte_array).expect("data_src_to_img: Cannot load image from memory");
    Ok(img)
}

fn img_to_jpg(img: image::DynamicImage, quality: i8) -> anyhow::Result<image::DynamicImage, String> {
    let mut bytes: Vec<u8> = Vec::new();
    img.write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Jpeg).expect("img_to_jpg: Cannot write image to buffer");
    Ok(img)
}

#[tauri::command]
fn convert_png_src_to_jpg_src(data_src: &str, quality: i8) -> Result<String, String> {
    let img = data_src_to_img(data_src)?;
    let jpg = img_to_jpg(img, quality)?;
    Ok(format!(
        "data:image/jpeg;base64,{}",
        general_purpose::STANDARD.encode(jpg.as_bytes())
    ))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![convert_png_src_to_jpg_src])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
