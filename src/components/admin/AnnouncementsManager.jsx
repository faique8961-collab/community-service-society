import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  LoaderCircle,
  Search,
  RefreshCw,
  Megaphone,
  FileText,
  Send,
  Eye,
  Upload,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import ImageCropper from "./ImageCropper";

const DRAFT_STORAGE_KEY = "mcs-css-admin-announcements-draft-v1";

const emptyForm = {
  title: "",
  body: "",
  status: "draft",
  image_url: "",
  image_aspect_ratio: "4:3",
  action_label: "",
  action_url: "",
};

function readSavedDraft() {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(DRAFT_STORAGE_KEY) || "null"
    );

    if (!saved?.form) return null;

    return {
      formOpen: Boolean(saved.formOpen),
      editingId: saved.editingId || null,
      form: { ...emptyForm, ...saved.form },
      uploadedPaths: Array.isArray(saved.uploadedPaths) ? saved.uploadedPaths : [],
    };
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return "Not published";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function AnnouncementsManager() {
  const savedDraft = useMemo(() => readSavedDraft(), []);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(savedDraft?.formOpen || false);
  const [editingId, setEditingId] = useState(savedDraft?.editingId || null);
  const [form, setForm] = useState(savedDraft?.form || emptyForm);
  const [uploadedPaths, setUploadedPaths] = useState(savedDraft?.uploadedPaths || []);
  const [cropFile, setCropFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    try {
      if (formOpen) {
        window.localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ formOpen, editingId, form, uploadedPaths })
        );
      } else {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch (storageError) {
      console.warn("Unable to save the announcement draft:", storageError);
    }
  }, [formOpen, editingId, form, uploadedPaths]);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("announcements")
      .select(
        "id, title, body, status, image_url, image_aspect_ratio, action_label, action_url, published_at, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message || "Unable to load announcements.");
      setAnnouncements([]);
    } else {
      setAnnouncements(data || []);
    }

    setLoading(false);
  }

  function openNewForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function openEditForm(announcement) {
    setEditingId(announcement.id);
    setForm({
      title: announcement.title || "",
      body: announcement.body || "",
      status: announcement.status || "draft",
      image_url: announcement.image_url || "",
      image_aspect_ratio: announcement.image_aspect_ratio || "4:3",
      action_label: announcement.action_label || "",
      action_url: announcement.action_url || "",
    });
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function closeForm() {
    if (uploadedPaths.length) {
      supabase.storage.from("society-images").remove(uploadedPaths).catch((removeError) => {
        console.warn("Could not clean up unfinished announcement images:", removeError);
      });
    }
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setUploadedPaths([]);
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    setError("");
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function getAnnouncementStoragePath(url) {
    if (typeof url !== "string") return null;
    try {
      const parsed = new URL(url);
      const marker = "/storage/v1/object/public/society-images/";
      const index = parsed.pathname.indexOf(marker);
      if (index < 0) return null;
      const path = decodeURIComponent(parsed.pathname.slice(index + marker.length));
      return path.startsWith("events/announcements/") ? path : null;
    } catch { return null; }
  }

  async function handleImageCrop(blob, originalName, ratio) {
    setUploadingImage(true);
    setError("");
    try {
      if (blob.size > 5 * 1024 * 1024) throw new Error("The cropped image is larger than 5 MB.");
      const safeName = originalName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 35) || "announcement";
      const unique = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `events/announcements/${safeName}-${unique}.webp`;
      const { error: uploadError } = await supabase.storage.from("society-images").upload(path, blob, { cacheControl: "3600", contentType: "image/webp", upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("society-images").getPublicUrl(path);
      if (!data?.publicUrl) throw new Error("The image uploaded, but its public URL could not be created.");
      setForm((current) => ({ ...current, image_url: data.publicUrl, image_aspect_ratio: ratio }));
      setUploadedPaths((current) => [...current, path]);
      setSuccess("Announcement image cropped and uploaded.");
    } catch (uploadError) {
      setError(uploadError.message || "Could not upload the announcement image.");
    } finally {
      setUploadingImage(false);
      setCropFile(null);
    }
  }

  async function cleanupUnusedAnnouncementImage(url, exceptId = null) {
    const path = getAnnouncementStoragePath(url);
    if (!path) return;
    let query = supabase.from("announcements").select("id").eq("image_url", url);
    if (exceptId) query = query.neq("id", exceptId);
    const { data, error: checkError } = await query;
    if (checkError || (data || []).length) return;
    const { error: removeError } = await supabase.storage.from("society-images").remove([path]);
    if (removeError) console.warn("Could not remove unused announcement image:", removeError);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const title = form.title.trim();
    const body = form.body.trim();

    if (!title || !body) {
      setError("Please provide both a title and announcement text.");
      return;
    }

    if (!["draft", "published"].includes(form.status)) {
      setError("Please choose a valid publication status.");
      return;
    }

    const actionLabel = form.action_label.trim();
    const actionUrl = form.action_url.trim();

    if (Boolean(actionLabel) !== Boolean(actionUrl)) {
      setError("Please provide both the button text and its destination URL, or leave both empty.");
      return;
    }

    if (actionLabel.length > 40) {
      setError("Button text must be 40 characters or fewer.");
      return;
    }

    if (actionUrl) {
      try {
        const parsedUrl = new URL(actionUrl);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Only HTTP and HTTPS links are supported.");
        }
      } catch {
        setError("Please enter a valid website or Google Forms URL beginning with https://.");
        return;
      }
    }

    setSaving(true);

    const now = new Date().toISOString();
    const previousImageUrl = editingId ? announcements.find((item) => item.id === editingId)?.image_url : null;
    const record = {
      title,
      body,
      status: form.status,
      image_url: form.image_url.trim() || null,
      image_aspect_ratio: form.image_aspect_ratio || "4:3",
      action_label: actionLabel || null,
      action_url: actionUrl || null,
      updated_at: now,
      published_at:
        form.status === "published"
          ? editingId
            ? announcements.find((item) => item.id === editingId)
                ?.published_at || now
            : now
          : null,
    };

    let result;

    if (editingId) {
      result = await supabase
        .from("announcements")
        .update(record)
        .eq("id", editingId);
    } else {
      result = await supabase.from("announcements").insert({
        ...record,
        created_at: now,
      });
    }

    if (result.error) {
      setError(result.error.message || "Unable to save this announcement.");
      setSaving(false);
      return;
    }

    if (previousImageUrl && previousImageUrl !== record.image_url) await cleanupUnusedAnnouncementImage(previousImageUrl, editingId);
    const retainedPath = getAnnouncementStoragePath(record.image_url);
    const unusedDraftPaths = uploadedPaths.filter((path) => path !== retainedPath);
    if (unusedDraftPaths.length) {
      const { error: cleanupError } = await supabase.storage.from("society-images").remove(unusedDraftPaths);
      if (cleanupError) console.warn("Could not remove unused announcement draft images:", cleanupError);
    }
    setSaving(false);
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setUploadedPaths([]);
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);

    setSuccess(
      form.status === "published"
        ? "Announcement published successfully."
        : "Announcement saved as a draft."
    );

    await loadAnnouncements();
  }

  async function handleDelete(announcement) {
    const confirmed = window.confirm(
      `Delete "${announcement.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(announcement.id);
    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcement.id);

    if (deleteError) {
      setError(deleteError.message || "Unable to delete this announcement.");
    } else {
      await cleanupUnusedAnnouncementImage(announcement.image_url, announcement.id);
      setSuccess("Announcement deleted.");
      if (editingId === announcement.id) closeForm();
      await loadAnnouncements();
    }

    setDeletingId(null);
  }

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(search.toLowerCase()) ||
      announcement.body.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" || announcement.status === filter;

    return matchesSearch && matchesFilter;
  });

  const publishedCount = announcements.filter(
    (item) => item.status === "published"
  ).length;
  const draftCount = announcements.length - publishedCount;

  return (
    <>
    {cropFile && <ImageCropper file={cropFile} defaultRatio="4:3" onCancel={() => setCropFile(null)} onApply={handleImageCrop} />}
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[#a52d36]">
            <Megaphone size={18} />
            <span className="text-xs font-bold uppercase tracking-[0.16em]">
              Content management
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#252a26]">
            Announcements
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#68716b]">
            Publish important updates, notices, opportunities, and society
            announcements.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#a52d36] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#86232b]"
        >
          <Plus size={17} />
          New announcement
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e5e2da] bg-white p-4">
          <div className="flex items-center gap-2 text-[#68716b]">
            <FileText size={17} />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Total
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#252a26]">
            {announcements.length}
          </p>
        </div>

        <div className="rounded-xl border border-[#e5e2da] bg-white p-4">
          <div className="flex items-center gap-2 text-[#68716b]">
            <Eye size={17} />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Published
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#252a26]">
            {publishedCount}
          </p>
        </div>

        <div className="rounded-xl border border-[#e5e2da] bg-white p-4">
          <div className="flex items-center gap-2 text-[#68716b]">
            <FileText size={17} />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Drafts
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#252a26]">
            {draftCount}
          </p>
        </div>
      </div>

      {success && (
        <div className="rounded-lg border border-[#cfe2d4] bg-[#f0f7f1] px-4 py-3 text-sm text-[#28633b]">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[#ead0d0] bg-[#fff4f4] px-4 py-3 text-sm text-[#a52d36]">
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-[#e5e2da] bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#252a26]">
                {editingId ? "Edit announcement" : "Create announcement"}
              </h3>
              <p className="mt-1 text-sm text-[#68716b]">
                {editingId
                  ? "Update the announcement details and publication status."
                  : "Write the notice and choose whether to publish it now or save it as a draft."}
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Close form"
              className="rounded-lg p-2 text-[#68716b] transition hover:bg-[#f7f6f2] hover:text-[#252a26]"
            >
              <X size={19} />
            </button>
          </div>

          <div>
            <label
              htmlFor="announcement-title"
              className="mb-2 block text-sm font-semibold text-[#46524a]"
            >
              Announcement title
            </label>
            <input
              id="announcement-title"
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              maxLength={180}
              required
              placeholder="e.g. Volunteer registration is now open"
              className="w-full rounded-lg border border-[#deded7] bg-white px-3.5 py-3 text-sm text-[#252a26] outline-none transition placeholder:text-[#a1a69f] focus:border-[#a52d36] focus:ring-2 focus:ring-[#a52d36]/10"
            />
            <p className="mt-1 text-right text-xs text-[#929991]">
              {form.title.length}/180
            </p>
          </div>

          <div>
            <label
              htmlFor="announcement-body"
              className="mb-2 block text-sm font-semibold text-[#46524a]"
            >
              Announcement text
            </label>
            <textarea
              id="announcement-body"
              value={form.body}
              onChange={(event) => updateField("body", event.target.value)}
              rows={8}
              required
              placeholder="Write the complete announcement here..."
              className="w-full resize-y rounded-lg border border-[#deded7] bg-white px-3.5 py-3 text-sm leading-6 text-[#252a26] outline-none transition placeholder:text-[#a1a69f] focus:border-[#a52d36] focus:ring-2 focus:ring-[#a52d36]/10"
            />
          </div>

          <div className="rounded-xl border border-[#e5e2da] p-4">
            <div className="text-sm font-semibold text-[#46524a]">Optional announcement image</div>
            <p className="mt-1 text-xs leading-5 text-[#929991]">Choose an image, crop it to a square, portrait, or landscape shape, and adjust its position before uploading.</p>
            <label className="mt-3 block text-sm font-semibold text-[#46524a]">Image URL (optional)
              <input type="url" value={form.image_url} onChange={(event) => updateField("image_url", event.target.value)} placeholder="https://..." className="mt-2 w-full rounded-lg border border-[#deded7] px-3.5 py-3 text-sm font-normal outline-none focus:border-[#a52d36]" />
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#deded7] px-4 py-2.5 text-sm font-semibold text-[#46524a] hover:bg-[#f7f6f2] ${uploadingImage ? "pointer-events-none opacity-60" : ""}`}>
                <Upload size={16} /> {uploadingImage ? "Uploading image…" : "Choose and crop image"}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingImage || saving} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) setCropFile(file); }} />
              </label>
              {form.image_url && <button type="button" onClick={() => updateField("image_url", "")} className="text-sm font-semibold text-red-600 hover:underline">Remove image</button>}
            </div>
            {form.image_url && <img src={form.image_url} alt="Announcement preview" className="mt-4 max-h-56 rounded-lg border border-[#e5e2da] object-contain" style={{ aspectRatio: (form.image_aspect_ratio || "3:4").replace(":", " / ") }} onError={(event) => { event.currentTarget.style.display = "none"; }} />}
          </div>

          <div className="rounded-xl border border-[#e5e2da] p-4">
            <div className="text-sm font-semibold text-[#46524a]">Optional action button</div>
            <p className="mt-1 text-xs leading-5 text-[#929991]">
              Add a link to Google Forms, registration pages, donation pages, or another external website.
              Leave both fields empty for a normal announcement.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#46524a]" htmlFor="announcement-action-label">
                Button text
                <input
                  id="announcement-action-label"
                  type="text"
                  value={form.action_label}
                  onChange={(event) => updateField("action_label", event.target.value)}
                  maxLength={40}
                  placeholder="e.g. Apply Now"
                  className="mt-2 w-full rounded-lg border border-[#deded7] bg-white px-3.5 py-3 text-sm font-normal text-[#252a26] outline-none focus:border-[#a52d36]"
                />
              </label>
              <label className="block text-sm font-semibold text-[#46524a]" htmlFor="announcement-action-url">
                Destination URL
                <input
                  id="announcement-action-url"
                  type="url"
                  value={form.action_url}
                  onChange={(event) => updateField("action_url", event.target.value)}
                  maxLength={2048}
                  placeholder="https://forms.gle/..."
                  className="mt-2 w-full rounded-lg border border-[#deded7] bg-white px-3.5 py-3 text-sm font-normal text-[#252a26] outline-none focus:border-[#a52d36]"
                />
              </label>
            </div>
            {form.action_label && form.action_url && (
              <p className="mt-3 text-xs text-[#68716b]">
                Public button preview: <span className="font-semibold text-[#a52d36]">{form.action_label}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="announcement-status"
              className="mb-2 block text-sm font-semibold text-[#46524a]"
            >
              Publication status
            </label>
            <select
              id="announcement-status"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              className="w-full rounded-lg border border-[#deded7] bg-white px-3.5 py-3 text-sm text-[#252a26] outline-none transition focus:border-[#a52d36] sm:max-w-xs"
            >
              <option value="draft">Save as draft</option>
              <option value="published">Publish now</option>
            </select>
            <p className="mt-1 text-xs leading-5 text-[#929991]">
              Drafts remain visible only in the admin dashboard. Published
              announcements are available to the public.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[#eeeae2] pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving || uploadingImage}
              className="rounded-lg border border-[#deded7] px-4 py-2.5 text-sm font-semibold text-[#46524a] transition hover:bg-[#f7f6f2] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#a52d36] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#86232b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : form.status === "published" ? (
                <Send size={16} />
              ) : (
                <Save size={16} />
              )}
              {saving
                ? "Saving..."
                : form.status === "published"
                  ? "Publish announcement"
                  : "Save draft"}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#929991]"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search announcements..."
            className="w-full rounded-lg border border-[#deded7] bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#a52d36]"
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter announcements"
          className="rounded-lg border border-[#deded7] bg-white px-3 py-2.5 text-sm text-[#46524a] outline-none focus:border-[#a52d36]"
        >
          <option value="all">All announcements</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>

        <button
          type="button"
          onClick={loadAnnouncements}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#deded7] bg-white px-3 py-2.5 text-sm font-semibold text-[#46524a] transition hover:bg-[#f7f6f2] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e5e2da] bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-3 px-5 py-14 text-sm text-[#68716b]">
            <LoaderCircle size={19} className="animate-spin" />
            Loading announcements...
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f6f2] text-[#929991]">
              <Megaphone size={22} />
            </div>
            <h3 className="mt-3 font-semibold text-[#252a26]">
              {announcements.length === 0
                ? "No announcements yet"
                : "No matching announcements"}
            </h3>
            <p className="mt-1 text-sm text-[#68716b]">
              {announcements.length === 0
                ? "Create your first announcement to get started."
                : "Try another search term or change the status filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eeeae2]">
            {filteredAnnouncements.map((announcement) => (
              <article
                key={announcement.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        announcement.status === "published"
                          ? "bg-[#edf5ee] text-[#28633b]"
                          : "bg-[#f3f0e8] text-[#78643a]"
                      }`}
                    >
                      {announcement.status}
                    </span>
                    <span className="text-xs text-[#929991]">
                      {announcement.status === "published"
                        ? `Published ${formatDate(announcement.published_at)}`
                        : `Created ${formatDate(announcement.created_at)}`}
                    </span>
                  </div>

                  <h3 className="break-words text-base font-bold text-[#252a26]">
                    {announcement.title}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#68716b]">
                    {announcement.body.length > 360
                      ? `${announcement.body.slice(0, 360).trimEnd()}…`
                      : announcement.body}
                  </p>
                  {announcement.action_label && announcement.action_url && (
                    <p className="mt-2 text-xs font-semibold text-[#a52d36]">
                      Button: {announcement.action_label}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:pt-1">
                  <button
                    type="button"
                    onClick={() => openEditForm(announcement)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#deded7] px-3 py-2 text-sm font-semibold text-[#46524a] transition hover:border-[#a52d36] hover:text-[#a52d36]"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(announcement)}
                    disabled={deletingId === announcement.id}
                    aria-label={`Delete ${announcement.title}`}
                    className="inline-flex items-center justify-center rounded-lg border border-[#ead0d0] p-2 text-[#a52d36] transition hover:bg-[#fff4f4] disabled:opacity-50"
                  >
                    {deletingId === announcement.id ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-[#929991]">
        {announcements.length} total{" "}
        {announcements.length === 1 ? "announcement" : "announcements"} in
        Supabase.
      </p>
    </div>
    </>
  );
}
