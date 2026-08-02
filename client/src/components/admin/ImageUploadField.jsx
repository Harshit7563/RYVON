import { useRef, useState } from "react";
import { adminUpload, fileToDataUrl, mediaUrl } from "../../api";

const ACCEPT =
  "image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.avif,.heic,.heif,.tif,.tiff,.ico";

const MAX_BYTES = 12 * 1024 * 1024;

function isImageFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|bmp|svg|avif|heic|heif|tiff?|ico)$/i.test(file.name || "");
}

/**
 * Shared admin image picker — any common image type, drag & drop / file choose.
 * preview: square | wide | round
 * variant: default | avatar (WhatsApp-style circular DP)
 */
export default function ImageUploadField({
  label = "Image",
  value,
  onChange,
  disabled = false,
  preview = "square",
  variant = "default",
  required = false,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file) => {
    if (!file) return;
    if (!isImageFile(file)) {
      setError("Only image files allowed (JPG, PNG, WEBP, GIF, SVG, AVIF, BMP, …)");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 12MB");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      const { url } = await adminUpload(dataUrl, file.name);
      onChange(url);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    uploadFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    uploadFile(e.dataTransfer.files?.[0]);
  };

  const openPicker = () => {
    if (!disabled && !uploading) inputRef.current?.click();
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT}
      className="hidden"
      disabled={disabled || uploading}
      onChange={onPick}
    />
  );

  if (variant === "avatar") {
    return (
      <div className="sm:col-span-2">
        <p className="text-xs font-bold uppercase text-mute">{label}</p>
        <div className="mt-3 flex flex-col items-center gap-3 sm:items-start">
          <div className="relative">
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={openPicker}
              onDragOver={(e) => {
                e.preventDefault();
                if (!disabled) setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`group relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-[3px] transition disabled:opacity-60 sm:h-32 sm:w-32 ${
                dragOver ? "border-tss ring-4 ring-tss/20" : "border-[#e0e0e0] hover:border-tss"
              } ${value ? "bg-wash" : "bg-[#ececec]"}`}
              aria-label="Set category photo"
            >
              {value ? (
                <img
                  src={mediaUrl(value)}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0.35";
                  }}
                />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center text-[#9a9a9a]">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4 0-7.5 2-7.5 4.5V20h15v-1.5C19.5 16 16 14 12 14z" />
                  </svg>
                </span>
              )}

              <span className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full bg-tss text-white shadow-md ring-2 ring-white transition group-hover:scale-105 sm:bottom-1.5 sm:right-1.5">
                {uploading ? (
                  <span className="text-[9px] font-bold">…</span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M4 8h3l2-2h6l2 2h3v11H4V8z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                )}
              </span>
            </button>
            {fileInput}
          </div>

          <div className="w-full max-w-sm text-center sm:text-left">
            <p className="text-[13px] font-semibold text-ink">
              {uploading ? "Uploading…" : value ? "Tap circle to change photo" : "Tap circle to add photo"}
            </p>
            <p className="mt-0.5 text-[11px] text-mute">JPG · PNG · WEBP · GIF · any image · max 12MB</p>
            {value && (
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => onChange("")}
                className="mt-2 text-[11px] font-bold uppercase tracking-wide text-tss"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-tss">{error}</p>}
      </div>
    );
  }

  const previewCls =
    preview === "wide"
      ? "h-36 w-full object-cover"
      : preview === "round"
        ? "h-24 w-24 rounded-full object-cover"
        : "h-28 w-28 object-cover";

  return (
    <div className="sm:col-span-2 space-y-2">
      <p className="text-xs font-bold uppercase text-mute">{label}</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-lg border border-dashed p-4 transition ${
          dragOver ? "border-tss bg-tss/5" : "border-line bg-wash/60"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={openPicker}
            className="bg-ink px-4 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Choose / drop image"}
          </button>
          <span className="text-[11px] text-mute">
            JPG · PNG · WEBP · GIF · SVG · AVIF · BMP · HEIC · max 12MB
          </span>
          {fileInput}
        </div>

        {value ? (
          <div className="mt-3 inline-block max-w-full overflow-hidden rounded border border-line bg-white">
            <img
              src={mediaUrl(value)}
              alt=""
              className={previewCls}
              onError={(e) => {
                e.currentTarget.style.opacity = "0.35";
              }}
            />
          </div>
        ) : null}
      </div>

      {error && <p className="text-xs font-semibold text-tss">{error}</p>}
    </div>
  );
}
