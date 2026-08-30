/**
 * Controlled image upload used by Branding (logos, sign-in imagery, hero).
 *
 * Validation is deliberately strict: only PNG / JPG / SVG, size and
 * dimension limits, no executable SVG content, aspect ratio preserved in
 * every preview (never stretched).
 */

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ImagePlus, Trash2 } from "lucide-react";
import type { ImageAsset } from "@/lib/branding-store";

const ACCEPTED = ["image/png", "image/jpeg", "image/svg+xml"];
const MAX_BYTES = 1024 * 1024; // 1 MB
const MAX_DIMENSION = 4000;
const MIN_DIMENSION = 16;

/** Reject scripting / external references inside SVG markup. */
function svgIsSafe(markup: string): boolean {
  return !/<script|onload=|onerror=|javascript:|<foreignObject|<!ENTITY/i.test(markup);
}

export function ImageUploadField({
  label,
  description,
  recommendation,
  value,
  onChange,
  allowDecorative = true,
}: {
  label: string;
  description?: string;
  recommendation: string;
  value: ImageAsset;
  onChange: (v: ImageAsset) => void;
  allowDecorative?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Unsupported format. Upload a PNG, JPG or SVG file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is too large. The maximum size is 1 MB.");
      return;
    }
    const text = file.type === "image/svg+xml" ? await file.text() : "";
    if (text && !svgIsSafe(text)) {
      setError("This SVG contains scripting or embedded content and cannot be used.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read"));
      reader.readAsDataURL(file);
    }).catch(() => null);
    if (!dataUrl) {
      setError("The file could not be read and may be corrupt.");
      return;
    }
    const dims = await new Promise<{ w: number; h: number } | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth || 512, h: img.naturalHeight || 512 });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
    if (!dims) {
      setError("The image could not be decoded and may be corrupt.");
      return;
    }
    if (
      dims.w > MAX_DIMENSION ||
      dims.h > MAX_DIMENSION ||
      dims.w < MIN_DIMENSION ||
      dims.h < MIN_DIMENSION
    ) {
      setError(
        `Image dimensions must be between ${MIN_DIMENSION}px and ${MAX_DIMENSION}px.`,
      );
      return;
    }
    onChange({
      url: dataUrl,
      fileName: file.name,
      width: dims.w,
      height: dims.h,
      alt: value?.alt ?? "",
      decorative: value?.decorative ?? false,
    });
  }

  return (
    <div className="space-y-2">
      <div>
        <Label className="text-[13px] font-medium">{label}</Label>
        {description && (
          <p className="text-[12px] text-muted-foreground">{description}</p>
        )}
        <p className="text-[12px] text-muted-foreground">{recommendation}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded border border-dashed border-border bg-background p-3">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-surface">
          {value ? (
            <img
              src={value.url}
              alt={value.decorative ? "" : value.alt || label}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] text-foreground">
            {value ? value.fileName : "No image uploaded"}
          </div>
          {value && (
            <div className="text-[12px] text-muted-foreground">
              {value.width} x {value.height} px
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {value ? "Replace" : "Upload"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              aria-label={`Remove ${label}`}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg"
          className="sr-only"
          aria-label={`${label} file`}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {value && allowDecorative && (
        <div className="space-y-2 rounded border border-border bg-background p-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${label}-decorative`}
              checked={value.decorative}
              onCheckedChange={(c) =>
                onChange({ ...value, decorative: c === true, alt: c === true ? "" : value.alt })
              }
            />
            <Label htmlFor={`${label}-decorative`} className="text-[12.5px] font-normal">
              This image is decorative
            </Label>
          </div>
          {!value.decorative && (
            <div>
              <Label htmlFor={`${label}-alt`} className="text-[12.5px]">
                Alt text
              </Label>
              <Input
                id={`${label}-alt`}
                value={value.alt}
                maxLength={140}
                placeholder="Describe what this image communicates"
                onChange={(e) => onChange({ ...value, alt: e.target.value })}
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-[12px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
