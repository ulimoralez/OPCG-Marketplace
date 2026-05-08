"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ListingGalleryProps {
  photos: string[];
  cardImageUrl: string | null;
  cardName: string;
}

export function ListingGallery({
  photos,
  cardImageUrl,
  cardName,
}: ListingGalleryProps) {
  const images = photos.length > 0 ? photos : cardImageUrl ? [cardImageUrl] : [];
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-[240px] h-[336px] bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 text-sm">
        Sin imagen
      </div>
    );
  }

  const prev = () => setCurrent((i) => (i - 1 + images.length) % images.length);
  const next = () => setCurrent((i) => (i + 1) % images.length);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Main image */}
      <div className="relative w-full bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl overflow-hidden flex items-center justify-center"
           style={{ minHeight: 336 }}>
        <Image
          src={images[current]}
          alt={`${cardName} - foto ${current + 1}`}
          width={240}
          height={336}
          className="object-contain drop-shadow-xl max-h-[336px] w-auto"
          priority={current === 0}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-2 right-3 text-xs text-white bg-black/40 rounded px-1.5 py-0.5">
              {current + 1}/{images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap justify-center">
          {images.map((url, i) => (
            <button
              key={url}
              onClick={() => setCurrent(i)}
              className={`relative w-14 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                i === current ? "border-primary" : "border-transparent hover:border-muted-foreground"
              }`}
            >
              <Image
                src={url}
                alt={`Miniatura ${i + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Label when showing seller photos */}
      {photos.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Fotos del vendedor · {photos.length} {photos.length === 1 ? "foto" : "fotos"}
        </p>
      )}
    </div>
  );
}
