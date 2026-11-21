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

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function EventsManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

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

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "title" && !editingId
        ? { slug: createSlug(value) }
        : {}),
    }));
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
    setFormOpen(false);
    setForm(emptyForm);
    setEditingId(null);

    await loadEvents();
    setSaving(false);
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this entry? This cannot be undone."
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setSuccess("Entry deleted successfully.");
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

            <label className="text-sm font-semibold sm:col-span-2">
              Cover image URL
              <input
                type="url"
                value={form.cover_image_url}
                onChange={(e) =>
                  updateField("cover_image_url", e.target.value)
                }
                className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal"
                placeholder="https://..."
              />
              <span className="mt-1 block text-xs font-normal text-[#929991]">
                We'll add direct image uploads in a later step.
              </span>
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Additional gallery image URLs
              <textarea
                rows={3}
                value={form.gallery_urls}
                onChange={(e) => updateField("gallery_urls", e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal"
                placeholder={"Paste one image URL per line"}
              />
            </label>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#a52d36] px-5 py-3 text-sm font-semibold text-white hover:bg-[#85232b] disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving
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
              Cancel
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
