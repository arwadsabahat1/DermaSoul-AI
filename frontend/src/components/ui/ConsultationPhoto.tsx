import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { fetchConsultationImageBlob } from "../../api/consultations";

/** Consultation thumbnails require Bearer auth — use blob URL instead of raw `img src`. */
export function ConsultationPhoto({ consultationId }: { consultationId: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;

    void fetchConsultationImageBlob(consultationId).then((url) => {
      if (!url) {
        if (!cancelled) setSrc(null);
        return;
      }
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      blobUrl = url;
      setSrc(url);
    });

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setSrc(null);
    };
  }, [consultationId]);

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-forest-900/5 text-forest-900/35">
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Consultation"
      className="h-full w-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
    />
  );
}
