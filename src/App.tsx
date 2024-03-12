import "./App.css";
import {useEffect, useState} from "react";

import {Label} from "@/components/ui/label.tsx";
import {Slider} from "@/components/ui/slider.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button.tsx";

import {invoke} from "@tauri-apps/api/tauri";
import { listen } from '@tauri-apps/api/event';
import { useToast } from "@/components/ui/use-toast";
import {Toaster} from "@/components/ui/toaster.tsx";


function App() {
  const [quality, setQuality] = useState<number>(50);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [jpegSrc, setJpegSrc] = useState<string | null>(null);

  const {toast} = useToast();

  useEffect(() => {
    listen<{ message: string }>('status', (e) => {
      toast({variant: "default", title: e?.payload?.message ?? "Something happened."});
    }).then()
  }, []);

  useEffect(() => {
    listen<{ message: string }>('error', (e) => {
      toast({variant: "destructive", title: e?.payload?.message ?? "Something went wrong."});
    }).then()
  }, []);

  async function handleImageInput() {
    try {
      let [path, preview]: string = await invoke('open_image_dialog');
      setPreviewSrc(preview);
      setSelectedImage(path);
    } catch (e: unknown) {
      if (e instanceof Error) {
        toast({ variant: "destructive", title: e?.message ?? "Something went wrong."});
      }
    }
  }
  async function convertToJPEG() {
    if (!selectedImage) {
      console.error('');toast({ variant: "destructive", title: "No image selected"});
      return;
    }
    try {
      let result: string = await invoke('convert_file_to_jpeg', {path: selectedImage, quality: quality});
      setJpegSrc(result);
    } catch (e: unknown) {
      if (e instanceof Error) {
        toast({ variant: "destructive", title: e?.message ?? "Something went wrong."});
      }
    }
  }

  return (
    <div className="container p-16 flex-col">
      <div className="border-2 border-gray-200 rounded p-3 flex-col mb-6">
        <div className="flex p-3 gap-6">
          <Button onClick={handleImageInput}>Select input image</Button>
          {!!previewSrc && <Avatar>
            <AvatarImage src={previewSrc ?? ""}/>
            <AvatarFallback>n/a</AvatarFallback>
          </Avatar>}
        </div>
        <div className="flex p-3 gap-6">
          <Label htmlFor="quality">Quality</Label>
          <Slider
            defaultValue={[50]}
            max={100}
            min={1}
            step={1}
            onValueChange={([value]) => {
              setQuality(value)
            }}
          />
          {quality}
        </div>
        <div className="flex p-3">
          <Button disabled={!selectedImage} onClick={convertToJPEG}>Convert to JPEG</Button>
        </div>
      </div>
      {jpegSrc && (<div className="border-2 border-gray-200 rounded">
        <img src={jpegSrc} alt="Resulting image" className={'rounded'}/>
      </div>)}
      <Toaster />
    </div>
  );
}

export default App;
