import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/services/api";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  /** Label displayed above the upload */
  label?: string;
  /** CSS class for the preview image */
  previewClassName?: string;
  /** Max size in MB for compression */
  maxSizeMB?: number;
  /** Max width/height in px for compression */
  maxDimension?: number;
  /** Subfolder on server (e.g. "products", "profiles") */
  folder?: string;
  /** Hide the image preview below the upload button */
  hidePreview?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  label = "Imagem",
  previewClassName = "h-32 w-32 object-cover rounded-lg border",
  maxSizeMB = 0.5,
  maxDimension = 800,
  folder = "general",
  hidePreview = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Compress on client
      const compressed = await imageCompression(file, {
        maxSizeMB,
        maxWidthOrHeight: maxDimension,
        useWebWorker: true,
      });
      const base64 = await imageCompression.getDataUrlFromFile(compressed);

      // Upload to server, get back a file path
      const { url } = await apiFetch<{ url: string }>("/upload", {
        method: "POST",
        body: JSON.stringify({ image: base64, folder }),
      });

      onChange(url);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClear = () => {
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Enviar imagem
            </>
          )}
        </Button>

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-default-red hover:text-default-red"
          >
            <X className="mr-1 h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {value && !hidePreview && (
        <img
          src={value}
          alt="Preview"
          className={previewClassName}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
          onLoad={(e) => {
            (e.target as HTMLImageElement).style.display = "block";
          }}
        />
      )}
    </div>
  );
}
