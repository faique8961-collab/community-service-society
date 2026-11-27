import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

function PhotoCropper({ file, onCancel, onApply, defaultRatio = "3:4" }) {
  const [ratio, setRatio] = useState(defaultRatio);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 });
  const [imageReady, setImageReady] = useState(false);
  const [working, setWorking] = useState(false);
  const [cropError, setCropError] = useState("");
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const ratioValue = ratio === "1:1" ? 1 : ratio === "4:3" ? 4 / 3 : 3 / 4;

  useEffect(() => {
    let cancelled = false;

    // Reset all image-specific state whenever a new file is selected.
    setImageReady(false);
    setCropError("");
    setZoom(1);
    setCenter({ x: 0.5, y: 0.5 });
    imageRef.current = null;

    if (!file) {
      setCropError("Please choose an image file.");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      if (cancelled) return;
      imageRef.current = image;
      setCropError("");
      setImageReady(true);
    };

    image.onerror = () => {
      if (cancelled) return;
      imageRef.current = null;
      setImageReady(false);
      setCropError("This image could not be opened. Please choose another file.");
    };

    image.src = objectUrl;

    return () => {
      cancelled = true;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  function getCrop() {
    const image = imageRef.current;
    if (!image) return null;

    let width = image.width;
    let height = image.height;

    if (width / height > ratioValue) width = height * ratioValue;
    else height = width / ratioValue;

    width /= zoom;
    height /= zoom;

    const minX = width / 2 / image.width;
    const maxX = 1 - minX;
    const minY = height / 2 / image.height;
    const maxY = 1 - minY;
    const x = Math.min(maxX, Math.max(minX, center.x));
    const y = Math.min(maxY, Math.max(minY, center.y));

    return {
      sx: x * image.width - width / 2,
      sy: y * image.height - height / 2,
      sw: width,
      sh: height,
    };
  }

  useEffect(() => {
    if (!imageReady || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const image = imageRef.current;
    const crop = getCrop();

    if (!context || !image || !crop) return;

    canvas.width = 360;
    canvas.height = Math.round(360 / ratioValue);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      image,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }, [imageReady, ratio, zoom, center]);

  function handlePointerDown(event) {
    if (!imageReady) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerMove(event) {
    if (!dragRef.current || !canvasRef.current || !imageRef.current) return;

    const previous = dragRef.current;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    dragRef.current = { x: event.clientX, y: event.clientY };

    const crop = getCrop();
    if (!crop) return;

    const scale = canvasRef.current.getBoundingClientRect().width / crop.sw;
    const image = imageRef.current;

    setCenter((current) => {
      const minX = crop.sw / 2 / image.width;
      const maxX = 1 - minX;
      const minY = crop.sh / 2 / image.height;
      const maxY = 1 - minY;

      return {
        x: Math.min(maxX, Math.max(minX, current.x - dx / scale / image.width)),
        y: Math.min(maxY, Math.max(minY, current.y - dy / scale / image.height)),
      };
    });
  }

  async function applyCrop() {
    const image = imageRef.current;
    const crop = getCrop();

    if (!image || !crop || working) return;

    setWorking(true);
    setCropError("");

    try {
      const output = document.createElement("canvas");
      output.width = 900;
      output.height = Math.round(900 / ratioValue);

      const context = output.getContext("2d");
      if (!context) {
        throw new Error("Your browser could not prepare this crop.");
      }

      context.drawImage(
        image,
        crop.sx,
        crop.sy,
        crop.sw,
        crop.sh,
        0,
        0,
        output.width,
        output.height
      );

      const blob = await new Promise((resolve) => {
        output.toBlob(resolve, "image/webp", 0.86);
      });

      if (!blob) {
        throw new Error("Could not create the cropped image. Please try again.");
      }

      await onApply(blob, file.name, ratio);
    } catch (error) {
      setCropError(
        error instanceof Error
          ? error.message
          : "Could not prepare this image. Please try again."
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Crop image"
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#252a26]">Adjust image</h2>
            <p className="mt-1 text-sm text-[#68716b]">
              Choose a shape, then drag the image to position it.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-[#68716b] hover:bg-[#f7f6f2]"
            aria-label="Cancel crop"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {["1:1", "3:4", "4:3"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setRatio(option);
                setCenter({ x: 0.5, y: 0.5 });
              }}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                ratio === option
                  ? "border-[#a52d36] bg-[#fbf1f1] text-[#a52d36]"
                  : "border-[#deded7] text-[#68716b]"
              }`}
            >
              {option}
              {option === "3:4"
                ? " · Portrait"
                : option === "1:1"
                  ? " · Square"
                  : " · Landscape"}
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-center">
          <div
            className="max-w-full overflow-hidden rounded-lg border border-[#deded7] bg-[#f7f6f2]"
            style={{ width: "min(360px, 100%)" }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={() => {
                dragRef.current = null;
              }}
              onPointerCancel={() => {
                dragRef.current = null;
              }}
              className={`block h-auto max-h-[48vh] w-full touch-none object-contain ${
                imageReady ? "cursor-grab active:cursor-grabbing" : ""
              }`}
            />
          </div>
        </div>

        {!imageReady && !cropError && (
          <p className="mt-3 text-center text-sm text-[#929991]">
            Preparing image…
          </p>
        )}

        <label className="mt-5 block text-sm font-semibold text-[#252a26]">
          Zoom{" "}
          <span className="font-normal text-[#68716b]">
            {zoom.toFixed(1)}×
          </span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="mt-2 w-full accent-[#a52d36]"
          />
        </label>

        {cropError && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {cropError}
          </p>
        )}

        <p className="mt-3 text-xs text-[#929991]">
          Tip: drag the photo to centre the face. The original file is not
          changed.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#deded7] px-4 py-3 text-sm font-semibold text-[#68716b]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!imageReady || working}
            onClick={applyCrop}
            className="rounded-lg bg-[#a52d36] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {working ? "Uploading…" : "Use this crop"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhotoCropper;
