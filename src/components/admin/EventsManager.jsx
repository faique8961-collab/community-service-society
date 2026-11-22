import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  LoaderCircle,
  CalendarDays,
  MapPin,
  RefreshCw,
  Search,
  ImagePlus,
  Upload,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const emptyForm = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  date_label: "",
  event_date: "",
  location: "",
  cover_image_url: "",
  gallery_urls: "",
  status: "draft",
};

// Keep an unfinished entry if the admin page reloads or is temporarily
// unmounted while the user switches tabs or sections.
const DRAFT_STORAGE_KEY = "mcs-css-admin-events-draft-v1";

function readSavedDraft() {
  try {
    const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || !parsed.form) return null;

    return {
      formOpen: Boolean(parsed.formOpen),
      editingId: parsed.editingId || null,
      form: { ...emptyForm, ...parsed.form },
      uploadedPaths: Array.isArray(parsed.uploadedPaths) ? parsed.uploadedPaths : [],
    };
  } catch {
    return null;
  }
}

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}


const STORAGE_BUCKET = "society-images";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

function loadImageForCompression(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(objectUrl); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error(`Could not read "${file.name}" as an image.`)); };
    image.src = objectUrl;
  });
}

async function compressImage(file) {
  if (!file.type.startsWith("image/")) throw new Error(`"${file.name}" is not an image file.`);
  if (file.size > MAX_SOURCE_BYTES) throw new Error(`"${file.name}" is larger than 20 MB. Choose a smaller image.`);
  const image = await loadImageForCompression(file);
  const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this image for upload.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const toBlob = (type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  let blob = await toBlob("image/webp", 0.82);
  let extension = "webp";
  let contentType = "image/webp";
  if (!blob || blob.type !== "image/webp") {
    blob = await toBlob("image/jpeg", 0.84);
    extension = "jpg";
    contentType = "image/jpeg";
  }
  if (!blob) throw new Error(`Could not compress "${file.name}".`);
  if (blob.size > MAX_UPLOAD_BYTES) {
    blob = await toBlob("image/jpeg", 0.68);
    extension = "jpg";
    contentType = "image/jpeg";
  }
  if (!blob || blob.size > MAX_UPLOAD_BYTES) throw new Error(`"${file.name}" is still larger than 5 MB after compression.`);
  return { blob, extension, contentType };
}

async function uploadImage(file, folder) {
  const { blob, extension, contentType } = await compressImage(file);
  const safeName = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image";
  const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `events/${folder}/${safeName}-${uniqueId}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, {
    cacheControl: "3600", contentType, upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("The image uploaded, but Supabase did not return its public URL.");
  return { url: data.publicUrl, path };
}

// Convert only public URLs belonging to this project's society-images bucket
// back into Storage object paths. External image URLs are deliberately ignored.
function getStoragePathFromPublicUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const parsedUrl = new URL(value);
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const markerIndex = parsedUrl.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const path = decodeURIComponent(parsedUrl.pathname.slice(markerIndex + marker.length));
    return path.startsWith("events/") ? path : null;
  } catch {
    return null;
  }
}

function getEventImageUrls(event) {
  return [
    event?.cover_image_url,
    ...(Array.isArray(event?.gallery_urls) ? event.gallery_urls : []),
  ].filter((url) => typeof url === "string" && url.trim());
}

export default function EventsManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Read a saved form once when this component is first created.
  const [savedDraft] = useState(readSavedDraft);
  const [uploadedPaths, setUploadedPaths] = useState(savedDraft?.uploadedPaths ?? []);
  const [formOpen, setFormOpen] = useState(savedDraft?.formOpen ?? false);
  const [editingId, setEditingId] = useState(savedDraft?.editingId ?? null);
  const [form, setForm] = useState(savedDraft?.form ?? emptyForm);

  // Save every change while the form is open. This is independent of whether
  // the browser tab is currently visible.
  useEffect(() => {
    if (!formOpen) return;

    try {
      window.localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ formOpen, editingId, form, uploadedPaths })
      );
    } catch (storageError) {
      console.warn("Unable to preserve the admin form draft:", storageError);
    }
  }, [formOpen, editingId, form, uploadedPaths]);

  async function loadEvents() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setEvents(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function openNewForm() {
    // Reopen an unfinished draft instead of silently replacing it with a blank form.
    const hasUnsavedDraft =
      Boolean(editingId) ||
      Object.entries(emptyForm).some(([field, emptyValue]) => form[field] !== emptyValue);

    if (hasUnsavedDraft) {
      setError("");
      setSuccess("");
      setFormOpen(true);
      return;
    }

    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function openEditForm(event) {
    setEditingId(event.id);
    setForm({
      title: event.title || "",
      slug: event.slug || "",
      summary: event.summary || "",
      description: event.description || "",
      date_label: event.date_label || "",
      event_date: event.event_date || "",
      location: event.location || "",
      cover_image_url: event.cover_image_url || "",
      gallery_urls: (event.gallery_urls || []).join("\n"),
      status: event.status || "draft",
    });
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function discardDraft() {
    const confirmed = window.confirm(
      editingId
        ? "Discard your unsaved changes to this entry?"
        : "Discard this unfinished entry?"
    );

    if (!confirmed) return;

    if (uploadedPaths.length) {
      supabase.storage.from(STORAGE_BUCKET).remove(uploadedPaths).catch((removeError) => {
        console.warn("Could not clean up draft image uploads:", removeError);
      });
    }
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    setUploadedPaths([]);
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
    setError("");
    setSuccess("");
  }

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "title" && !editingId
        ? { slug: createSlug(value) }
        : {}),
    }));
  }


  async function handleCoverUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingCover(true);
    setError("");
    setSuccess("");
    try {
      const uploaded = await uploadImage(file, "covers");
      updateField("cover_image_url", uploaded.url);
      setUploadedPaths((previous) => [...previous, uploaded.path]);
      setSuccess("Cover image uploaded to Supabase Storage.");
    } catch (uploadError) {
      setError(uploadError.message || "The cover image could not be uploaded.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleGalleryUpload(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setUploadingGallery(true);
    setError("");
    setSuccess("");
    const uploadedUrls = [];
    const newPaths = [];
    try {
      for (const file of files) {
        const uploaded = await uploadImage(file, "gallery");
        uploadedUrls.push(uploaded.url);
        newPaths.push(uploaded.path);
      }
      setForm((previous) => {
        const existing = previous.gallery_urls.split("\n").map((url) => url.trim()).filter(Boolean);
        return { ...previous, gallery_urls: [...existing, ...uploadedUrls].join("\n") };
      });
      setUploadedPaths((previous) => [...previous, ...newPaths]);
      setSuccess(`${uploadedUrls.length} gallery image${uploadedUrls.length === 1 ? "" : "s"} uploaded to Supabase Storage.`);
    } catch (uploadError) {
      setError(`${uploadError.message || "A gallery image could not be uploaded."} Any images that finished uploading remain attached to this draft.`);
      if (newPaths.length) {
        setUploadedPaths((previous) => [...previous, ...newPaths]);
        setForm((previous) => {
          const existing = previous.gallery_urls.split("\n").map((url) => url.trim()).filter(Boolean);
          return { ...previous, gallery_urls: [...existing, ...uploadedUrls].join("\n") };
        });
      }
    } finally {
      setUploadingGallery(false);
    }
  }

  async function removeUploadedImage(url, field) {
    const matchingPath = uploadedPaths.find((path) => {
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      return data?.publicUrl === url;
    });
    if (matchingPath) {
      const { error: removeError } = await supabase.storage.from(STORAGE_BUCKET).remove([matchingPath]);
      if (removeError) {
        setError(`Could not remove the uploaded image: ${removeError.message}`);
        return;
      }
      setUploadedPaths((previous) => previous.filter((path) => path !== matchingPath));
    }
    if (field === "cover_image_url") {
      updateField(field, "");
    } else {
      updateField(field, form.gallery_urls.split("\n").map((item) => item.trim()).filter((item) => item && item !== url).join("\n"));
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const slug = createSlug(form.slug || form.title);

    if (!form.title.trim()) {
      setError("Please enter a title.");
      setSaving(false);
      return;
    }

    if (!slug) {
      setError("Please enter a valid title or slug.");
      setSaving(false);
      return;
    }

    const galleryUrls = form.gallery_urls
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);

    const record = {
      title: form.title.trim(),
      slug,
      summary: form.summary.trim() || null,
      description: form.description.trim() || null,
      date_label: form.date_label.trim() || null,
      event_date: form.event_date || null,
      location: form.location.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      gallery_urls: galleryUrls,
      status: form.status,
    };

    let result;

    if (editingId) {
      result = await supabase
        .from("events")
        .update(record)
        .eq("id", editingId);
    } else {
      result = await supabase.from("events").insert(record);
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setSuccess(
      editingId ? "Entry updated successfully." : "Entry created successfully."
    );

    // The database save succeeded, so this unfinished draft is no longer needed.
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    setUploadedPaths([]);

    setFormOpen(false);
    setForm(emptyForm);
    setEditingId(null);

    await loadEvents();
    setSaving(false);
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this entry? Its images will also be removed from Storage unless another event uses them. This cannot be undone."
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    // Fetch the image references before deleting the event. Also fetch the
    // remaining events so shared images are not accidentally deleted.
    const { data: eventToDelete, error: eventFetchError } = await supabase
      .from("events")
      .select("id, cover_image_url, gallery_urls")
      .eq("id", id)
      .single();

    if (eventFetchError) {
      setError(`Could not check this entry's images. Nothing was deleted. ${eventFetchError.message}`);
      return;
    }

    const { data: remainingEvents, error: remainingFetchError } = await supabase
      .from("events")
      .select("id, cover_image_url, gallery_urls")
      .neq("id", id);

    if (remainingFetchError) {
      setError(`Could not check whether any images are shared. Nothing was deleted. ${remainingFetchError.message}`);
      return;
    }

    const remainingImageUrls = new Set(
      (remainingEvents || []).flatMap((event) => getEventImageUrls(event))
    );
    const imagePathsToRemove = [
      ...new Set(
        getEventImageUrls(eventToDelete)
          .filter((url) => !remainingImageUrls.has(url))
          .map(getStoragePathFromPublicUrl)
          .filter(Boolean)
      ),
    ];

    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    // Delete the database record first. If Storage cleanup fails, the event
    // remains safely deleted and the warning tells the admin what happened.
    if (imagePathsToRemove.length) {
      const { error: storageError } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .remove(imagePathsToRemove);

      if (storageError) {
        setSuccess("Entry deleted successfully.");
        setError(`The entry was deleted, but its image files could not be removed from Storage: ${storageError.message}`);
        await loadEvents();
        return;
      }
    }

    setSuccess(
      imagePathsToRemove.length
        ? `Entry and ${imagePathsToRemove.length} unused image file${imagePathsToRemove.length === 1 ? "" : "s"} deleted successfully.`
        : "Entry deleted successfully. Any shared images were kept, and external image URLs were left untouched."
    );
    await loadEvents();
  }

  const filteredEvents = events.filter((event) => {
    const searchTerm = search.toLowerCase();
    const matchesSearch =
      (event.title || "").toLowerCase().includes(searchTerm) ||
      (event.location || "").toLowerCase().includes(searchTerm);

    const matchesFilter =
      filter === "all" || event.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a52d36]">
            Content management
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Events & Initiatives
          </h1>
          <p className="mt-2 text-sm text-[#68716b]">
            Manage all society activities in one place.
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="inline-flex items-center gap-2 rounded-lg bg-[#a52d36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#85232b]"
        >
          <Plus size={17} />
          Add new entry
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleSave}
          className="mt-8 rounded-xl border border-[#e5e2da] bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {editingId ? "Edit entry" : "Create new entry"}
              </h2>
              <p className="mt-1 text-xs text-[#929991]">
                Fields marked with * are required.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg p-2 text-[#68716b] hover:bg-[#f7f6f2]"
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Title *
              <input
                required
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal outline-none focus:border-[#a52d36]"
                placeholder="e.g. Winter Donation Drive"
              />
            </label>

            <label className="text-sm font-semibold">
              URL slug *
              <input
                required
                value={form.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal outline-none focus:border-[#a52d36]"
                placeholder="winter-donation-drive"
              />
            </label>

            <label className="text-sm font-semibold">
              Publication status
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#deded7] bg-white px-3 py-3 font-normal"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>

            <label className="text-sm font-semibold">
              Date label
              <input
                value={form.date_label}
                onChange={(e) => updateField("date_label", e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal"
                placeholder="e.g. November 2026"
              />
            </label>

            <label className="text-sm font-semibold">
              Exact date
              <input
                type="date"
                value={form.event_date}
                onChange={(e) => updateField("event_date", e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Location
              <input
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal"
                placeholder="e.g. MCS Campus"
              />
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Short summary
              <textarea
                rows={2}
                value={form.summary}
                onChange={(e) => updateField("summary", e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal"
                placeholder="A short introduction shown on the events page."
              />
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Full description
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal"
                placeholder="Write the full details of this activity."
              />
            </label>

            <div className="sm:col-span-2 rounded-xl border border-[#e5e2da] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ImagePlus size={17} className="text-[#a52d36]" />
                Cover image
              </div>
              <p className="mt-1 text-xs font-normal text-[#929991]">
                Upload from your computer or keep using an existing image URL. Images are resized and compressed before upload.
              </p>
              <label className="mt-3 block text-sm font-semibold">
                Cover image URL (optional)
                <input
                  type="url"
                  value={form.cover_image_url}
                  onChange={(e) => updateField("cover_image_url", e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal"
                  placeholder="https://..."
                />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#deded7] px-4 py-2.5 text-sm font-semibold text-[#46524a] hover:bg-[#f7f6f2] ${uploadingCover ? "pointer-events-none opacity-60" : ""}`}>
                  {uploadingCover ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploadingCover ? "Uploading cover..." : "Choose cover image"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingCover || saving} onChange={handleCoverUpload} />
                </label>
                {form.cover_image_url && (
                  <button type="button" onClick={() => removeUploadedImage(form.cover_image_url, "cover_image_url")} className="text-sm font-semibold text-red-600 hover:underline">
                    Remove cover
                  </button>
                )}
              </div>
              {form.cover_image_url && (
                <img src={form.cover_image_url} alt="Cover preview" className="mt-4 max-h-56 w-full rounded-lg border border-[#e5e2da] object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              )}
            </div>

            <div className="sm:col-span-2 rounded-xl border border-[#e5e2da] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ImagePlus size={17} className="text-[#a52d36]" />
                Gallery images
              </div>
              <p className="mt-1 text-xs font-normal text-[#929991]">
                Upload multiple images at once, or paste existing image URLs below (one per line).
              </p>
              <label className={`mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#deded7] px-4 py-2.5 text-sm font-semibold text-[#46524a] hover:bg-[#f7f6f2] ${uploadingGallery ? "pointer-events-none opacity-60" : ""}`}>
                {uploadingGallery ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploadingGallery ? "Uploading gallery images..." : "Choose gallery images"}
                <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingGallery || saving} onChange={handleGalleryUpload} />
              </label>
              <label className="mt-4 block text-sm font-semibold">
                Additional gallery image URLs
                <textarea
                  rows={3}
                  value={form.gallery_urls}
                  onChange={(e) => updateField("gallery_urls", e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal"
                  placeholder={"Paste one image URL per line"}
                />
              </label>
              {form.gallery_urls.trim() && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {form.gallery_urls.split("\n").map((url) => url.trim()).filter(Boolean).map((url, index) => (
                    <div key={`${url}-${index}`} className="relative overflow-hidden rounded-lg border border-[#e5e2da]">
                      <img src={url} alt={`Gallery preview ${index + 1}`} className="h-28 w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      <button type="button" onClick={() => removeUploadedImage(url, "gallery_urls")} className="absolute right-2 top-2 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-red-600 shadow">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || uploadingCover || uploadingGallery}
              className="inline-flex items-center gap-2 rounded-lg bg-[#a52d36] px-5 py-3 text-sm font-semibold text-white hover:bg-[#85232b] disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {uploadingCover || uploadingGallery
                ? "Uploading images..."
                : saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Create entry"}
            </button>

            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-[#deded7] px-5 py-3 text-sm font-semibold text-[#68716b] hover:bg-[#f7f6f2]"
            >
              Close (keep draft)
            </button>

            <button
              type="button"
              onClick={discardDraft}
              className="rounded-lg border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              {editingId ? "Discard changes" : "Discard draft"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929991]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or location..."
            className="w-full rounded-lg border border-[#deded7] bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-[#a52d36]"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-[#deded7] bg-white px-3 py-3 text-sm"
        >
          <option value="all">All entries</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>

        <button
          onClick={loadEvents}
          className="inline-flex items-center gap-2 rounded-lg border border-[#deded7] bg-white px-4 py-3 text-sm font-semibold text-[#68716b] hover:bg-[#f7f6f2]"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-[#e5e2da] bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-[#68716b]">
            <LoaderCircle size={20} className="animate-spin text-[#a52d36]" />
            Loading entries...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays size={30} className="mx-auto text-[#c2c5bd]" />
            <h3 className="mt-4 font-bold">No entries found</h3>
            <p className="mt-2 text-sm text-[#929991]">
              Create your first society activity to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eeeae3]">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{event.title}</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        event.status === "published"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  {event.summary && (
                    <p className="mt-2 line-clamp-2 text-sm text-[#68716b]">
                      {event.summary}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#929991]">
                    {event.date_label && (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={13} />
                        {event.date_label}
                      </span>
                    )}
                    {event.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEditForm(event)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#deded7] px-3 py-2 text-xs font-semibold text-[#46524a] hover:border-[#a52d36] hover:text-[#a52d36]"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(event.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-[#929991]">
        {events.length} total {events.length === 1 ? "entry" : "entries"} in
        the database.
      </p>
    </div>
  );
}
