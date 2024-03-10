import "./App.css";
import {useState} from "react";

import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Slider} from "@/components/ui/slider.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button.tsx";

import {invoke} from "@tauri-apps/api/tauri"

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function App() {
  const [quality, setQuality] = useState<number>(50);
  const [dataSrc, setDataSrc] = useState<string | null>(null);
  const [jpegSrc, setJpegSrc] = useState<string | null>(null);

  async function handleImageInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setDataSrc(base64);
    }
  }

  async function convertToJPEG() {
    if (!dataSrc) return;
    let result: string = await invoke('convert_png_src_to_jpg_src', {dataSrc: dataSrc.split(',')[1], quality: quality});
    console.log(result);
    setJpegSrc(result);
  }

  return (
    <div className="container p-16 flex">
      <div className="grid w-full items-center gap-6">
        <div className="item">
          <Label htmlFor="picture">Picture</Label>
          <div className="flex gap-6">
            <Input id="picture" type="file" onChange={handleImageInput}/>
            <Avatar>
              <AvatarImage src={dataSrc ?? ""} />
              <AvatarFallback>n/a</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="item">
          <Label htmlFor="quality">Quality ({quality})</Label>
          <Slider
            defaultValue={[50]}
            max={100}
            min={1}
            step={1}
            onValueChange={([value]) => {
              setQuality(value)
            }}
          />
        </div>

        <Separator/>

        <div className="item">
          <Button onClick={convertToJPEG}>Save as .jpg</Button>
        </div>

        {jpegSrc && (<div className="item">
          <Label htmlFor="result">Result</Label>
          <img src={jpegSrc} alt="Resulting image" className={'rounded'}/>
        </div>)}

      </div>
    </div>
  );
}

export default App;
