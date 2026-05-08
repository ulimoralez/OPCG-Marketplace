"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ImagePlus, X, Loader2 } from "lucide-react";

const MAX_PHOTOS = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

interface PhotosUploadProps {
  userId: string;
  value: string[];
  onChange: (urls: string[]) => void;
}

export function PhotosUpload({ userId, value, onChange }: PhotosUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - value.length;
    const toUpload = files.slice(0, remaining);

    setError("");
    setUploading(true);

    const uploaded: string[] = [];

    for (const file of toUpload) {
      if (!ACCEPTED.includes(file.type)) {
        setError("Solo se aceptan imágenes JPG, PNG o WebP.");
        continue;
      }
      if (file.size > MAX_SIZE) {
        setError("Cada imagen no puede superar los 5 MB.");
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-photos")
        .upload(path, file);

      if (uploadError) {
        setError("Error al subir una imagen.");
        continue;
      }

      const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    onChange([...value, ...uploaded]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {value.map((url) => (
          <div key={url} className="relative group w-24 h-32">
            <Image
              src={url}
              alt="Foto de la carta"
              fill
              className="object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {value.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-32 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">Agregar</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground">
        Hasta {MAX_PHOTOS} fotos · JPG, PNG o WebP · Máx 5 MB c/u
        {value.length > 0 && ` · ${value.length}/${MAX_PHOTOS} subidas`}
      </p>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
