import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Save, LoaderCircle, Search, Upload, RefreshCw, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";
import PhotoCropper from "./ImageCropper";

const STORAGE_BUCKET = "society-images";
const DRAFT_STORAGE_KEY = "mcs-css-admin-team-draft-v1";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const emptyForm = { name: "", position: "", bio: "", image_url: "", image_aspect_ratio: "3:4", sort_order: "0", is_active: true };

function readSavedDraft() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY) || "null");
    if (!saved?.form) return null;
    return { formOpen: Boolean(saved.formOpen), editingId: saved.editingId || null, form: { ...emptyForm, ...saved.form }, uploadedPaths: Array.isArray(saved.uploadedPaths) ? saved.uploadedPaths : [] };
  } catch { return null; }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read this image file.")); };
    image.src = url;
  });
}

async function compressImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("The selected image exceeds 20 MB.");
  const image = await loadImage(file);
  const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this image.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const toBlob = (type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality));
  let blob = await toBlob("image/webp", 0.82);
  let extension = "webp";
  let contentType = "image/webp";
  if (!blob || blob.type !== "image/webp") {
    blob = await toBlob("image/jpeg", 0.82);
    extension = "jpg";
    contentType = "image/jpeg";
  }
  if (!blob || blob.size > MAX_UPLOAD_BYTES) {
    blob = await toBlob("image/jpeg", 0.65);
    extension = "jpg";
    contentType = "image/jpeg";
  }
  if (!blob || blob.size > MAX_UPLOAD_BYTES) throw new Error("The compressed image is still larger than 5 MB.");
  return { blob, extension, contentType };
}

async function uploadPhoto(file, originalName = "member") {
  const { blob, extension, contentType } = await compressImage(file);
  const safeName = originalName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 35) || "member";
  const unique = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `team/${safeName}-${unique}.${extension}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, { cacheControl: "3600", contentType, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("The photo uploaded but its public URL could not be created.");
  return { path, url: data.publicUrl };
}


function getTeamStoragePath(url) {
  if (typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const index = parsed.pathname.indexOf(marker);
    if (index < 0) return null;
    const path = decodeURIComponent(parsed.pathname.slice(index + marker.length));
    return path.startsWith("team/") ? path : null;
  } catch { return null; }
}

export default function TeamManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [savedDraft] = useState(readSavedDraft);
  const [formOpen, setFormOpen] = useState(savedDraft?.formOpen ?? false);
  const [editingId, setEditingId] = useState(savedDraft?.editingId ?? null);
  const [form, setForm] = useState(savedDraft?.form ?? emptyForm);
  const [uploadedPaths, setUploadedPaths] = useState(savedDraft?.uploadedPaths ?? []);

  useEffect(() => {
    if (!formOpen) return;
    try { window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ formOpen, editingId, form, uploadedPaths })); }
    catch (storageError) { console.warn("Unable to preserve the team form draft:", storageError); }
  }, [formOpen, editingId, form, uploadedPaths]);

  async function loadMembers() {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase.from("team_members").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (fetchError) setError(fetchError.message);
    else setMembers(data || []);
    setLoading(false);
  }

  useEffect(() => { loadMembers(); }, []);

  function updateField(field, value) { setForm(previous => ({ ...previous, [field]: value })); }

  function openNewForm() {
    const hasDraft = editingId || form.name || form.position || form.bio || form.image_url;
    if (!hasDraft) { setEditingId(null); setForm({ ...emptyForm, sort_order: String(members.length * 10) }); }
    setError(""); setSuccess(""); setFormOpen(true);
  }

  function openEditForm(member) {
    setEditingId(member.id);
    setForm({ name: member.name || "", position: member.position || "", bio: member.bio || "", image_url: member.image_url || "", image_aspect_ratio: member.image_aspect_ratio || "3:4", sort_order: String(member.sort_order ?? 0), is_active: member.is_active !== false });
    setUploadedPaths([]); setError(""); setSuccess(""); setFormOpen(true);
  }

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > MAX_SOURCE_BYTES) { setError("The selected image exceeds 20 MB."); return; }
    setError(""); setSuccess(""); setCropFile(file);
  }

  async function handleCroppedPhoto(blob, originalName, aspectRatio) {
    setUploading(true); setError(""); setSuccess("");
    try {
      const uploaded = await uploadPhoto(blob, originalName);
      setForm(previous => ({ ...previous, image_url: uploaded.url, image_aspect_ratio: aspectRatio }));
      setUploadedPaths(previous => [...previous, uploaded.path]);
      setCropFile(null);
      setSuccess("Cropped photograph uploaded to Supabase Storage.");
    } catch (uploadError) { setError(uploadError.message || "Photo upload failed."); }
    finally { setUploading(false); }
  }

  async function handleSave(event) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    if (!form.name.trim() || !form.position.trim()) { setError("Name and position are required."); setSaving(false); return; }
    const record = { name: form.name.trim(), position: form.position.trim(), bio: form.bio.trim() || null, image_url: form.image_url.trim() || null, image_aspect_ratio: form.image_aspect_ratio || "3:4", sort_order: Number.parseInt(form.sort_order, 10) || 0, is_active: Boolean(form.is_active), updated_at: new Date().toISOString() };
    const result = editingId ? await supabase.from("team_members").update(record).eq("id", editingId) : await supabase.from("team_members").insert(record);
    if (result.error) { setError(result.error.message); setSaving(false); return; }
    const previousPhoto = editingId ? members.find(member => member.id === editingId)?.image_url : null;
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    setUploadedPaths([]); setFormOpen(false); setForm(emptyForm); setEditingId(null);
    await loadMembers();
    if (previousPhoto && previousPhoto !== record.image_url) await removePhotoIfUnused(previousPhoto);
    setSuccess(editingId ? "Team member updated successfully." : "Team member added successfully.");
    setSaving(false);
  }

  async function removePhotoIfUnused(url) {
    const path = getTeamStoragePath(url);
    if (!path) return;
    const { data, error: checkError } = await supabase.from("team_members").select("id").eq("image_url", url).limit(1);
    if (checkError || data?.length) return;
    const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    if (storageError) console.warn("Could not remove an unused team photo:", storageError.message);
  }

  async function handleDelete(member) {
    if (!window.confirm(`Delete ${member.name} from the team? This cannot be undone.`)) return;
    setError(""); setSuccess("");
    const { error: deleteError } = await supabase.from("team_members").delete().eq("id", member.id);
    if (deleteError) { setError(deleteError.message); return; }
    await loadMembers();
    await removePhotoIfUnused(member.image_url);
    setSuccess(`${member.name} was deleted.`);
  }

  function discardDraft() {
    if (!window.confirm("Discard this unfinished team-member form?")) return;
    const currentPaths = [...uploadedPaths];
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    setUploadedPaths([]); setForm(emptyForm); setEditingId(null); setFormOpen(false); setError(""); setSuccess("");
    if (currentPaths.length) supabase.storage.from(STORAGE_BUCKET).remove(currentPaths).then(({ error: removeError }) => { if (removeError) console.warn("Could not clean up draft photos:", removeError.message); });
  }

  const filteredMembers = members.filter(member => {
    const term = search.toLowerCase();
    const matchesSearch = member.name.toLowerCase().includes(term) || member.position.toLowerCase().includes(term);
    return matchesSearch && (filter === "all" || (filter === "active" ? member.is_active : !member.is_active));
  });

  return <div>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a52d36]">Content management</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Our Team</h1><p className="mt-2 text-sm text-[#68716b]">Manage office-bearers, biographies, photographs, and their display order.</p></div><button onClick={openNewForm} className="inline-flex items-center gap-2 rounded-lg bg-[#a52d36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#85232b]"><Plus size={17}/> Add team member</button></div>
    {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {success && <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}
    {formOpen && <form onSubmit={handleSave} className="mt-8 rounded-xl border border-[#e5e2da] bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-bold">{editingId ? "Edit team member" : "Add team member"}</h2><p className="mt-1 text-xs text-[#929991]">Name and position are required. Inactive members are hidden from the public page.</p></div><button type="button" onClick={discardDraft} className="rounded-lg p-2 text-[#929991] hover:bg-[#f7f6f2]" aria-label="Discard form"><X size={19}/></button></div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-semibold">Full name<input required value={form.name} onChange={e => updateField("name", e.target.value)} className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal outline-none focus:border-[#a52d36]" placeholder="Member name"/></label>
        <label className="block text-sm font-semibold">Position / role<input required value={form.position} onChange={e => updateField("position", e.target.value)} className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal outline-none focus:border-[#a52d36]" placeholder="e.g. Vice President"/></label>
        <label className="block text-sm font-semibold md:col-span-2">Biography<textarea rows={4} value={form.bio} onChange={e => updateField("bio", e.target.value)} className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal outline-none focus:border-[#a52d36]" placeholder="A short introduction..."/></label>
        <div className="md:col-span-2"><span className="text-sm font-semibold">Profile photograph</span><div className="mt-2 flex flex-wrap items-center gap-4">{form.image_url ? <div className="w-28 shrink-0 overflow-hidden rounded-lg border border-[#e5e2da] bg-[#f7f6f2]" style={{ aspectRatio: (form.image_aspect_ratio || "3:4").replace(":", " / ") }}><img src={form.image_url} alt="Team member preview" className="h-full w-full object-cover"/></div> : <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-[#f7f6f2] text-[#929991]"><Users size={30}/></div>}<div><label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#deded7] px-4 py-3 text-sm font-semibold ${uploading ? "opacity-60" : "hover:border-[#a52d36]"}`}><Upload size={16}/>{uploading ? "Uploading..." : "Choose photograph"}<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handlePhotoUpload}/></label><p className="mt-2 text-xs text-[#929991]">Choose a crop for this member before uploading. Images are compressed to under 5 MB.</p>{form.image_url && <button type="button" onClick={() => updateField("image_url", "")} className="mt-2 text-xs font-semibold text-[#a52d36]">Remove photo from this profile</button>}</div></div></div>
        <label className="block text-sm font-semibold">Display order<input type="number" value={form.sort_order} onChange={e => updateField("sort_order", e.target.value)} className="mt-2 w-full rounded-lg border border-[#deded7] px-3 py-3 font-normal outline-none focus:border-[#a52d36]"/><span className="mt-1 block text-xs font-normal text-[#929991]">Lower numbers appear first.</span></label>
        <label className="flex items-center gap-3 self-center text-sm font-semibold"><input type="checkbox" checked={form.is_active} onChange={e => updateField("is_active", e.target.checked)} className="h-4 w-4 accent-[#a52d36]"/> Visible on public team page</label>
      </div>
      <div className="mt-7 flex flex-wrap gap-3"><button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-lg bg-[#a52d36] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle size={16} className="animate-spin"/> : <Save size={16}/>} {saving ? "Saving..." : "Save member"}</button><button type="button" onClick={discardDraft} className="rounded-lg border border-[#deded7] px-5 py-3 text-sm font-semibold text-[#68716b]">Discard</button></div>
    </form>}
    {cropFile && <PhotoCropper file={cropFile} onCancel={() => setCropFile(null)} onApply={handleCroppedPhoto}/>}
    <div className="mt-8 flex flex-wrap gap-3"><div className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929991]"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or position..." className="w-full rounded-lg border border-[#deded7] bg-white py-3 pl-9 pr-3 text-sm outline-none focus:border-[#a52d36]"/></div><select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-lg border border-[#deded7] bg-white px-3 py-3 text-sm"><option value="all">All members</option><option value="active">Visible</option><option value="inactive">Hidden</option></select><button onClick={loadMembers} className="inline-flex items-center gap-2 rounded-lg border border-[#deded7] bg-white px-3 py-3 text-sm font-semibold text-[#68716b]"><RefreshCw size={15}/> Refresh</button></div>
    <div className="mt-5 overflow-hidden rounded-xl border border-[#e5e2da] bg-white">{loading ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-[#929991]"><LoaderCircle className="animate-spin" size={18}/> Loading team members...</div> : filteredMembers.length ? <div className="divide-y divide-[#eeeae3]">{filteredMembers.map(member => <div key={member.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5"><div className="w-16 shrink-0 overflow-hidden rounded-lg bg-[#f7f6f2]" style={{ aspectRatio: (member.image_aspect_ratio || "3:4").replace(":", " / ") }}>{member.image_url ? <img src={member.image_url} alt={member.name} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-[#929991]"><Users size={23}/></div>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#252a26]">{member.name}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${member.is_active ? "bg-green-50 text-green-700" : "bg-[#f1f0ec] text-[#777f78]"}`}>{member.is_active ? "VISIBLE" : "HIDDEN"}</span></div><p className="mt-1 text-sm text-[#a52d36]">{member.position}</p><p className="mt-1 text-xs text-[#929991]">Display order: {member.sort_order}</p></div><div className="flex gap-2"><button onClick={() => openEditForm(member)} className="rounded-lg border border-[#deded7] p-2.5 text-[#68716b] hover:border-[#a52d36] hover:text-[#a52d36]" aria-label={`Edit ${member.name}`}><Pencil size={16}/></button><button onClick={() => handleDelete(member)} className="rounded-lg border border-[#deded7] p-2.5 text-[#68716b] hover:border-red-300 hover:text-red-600" aria-label={`Delete ${member.name}`}><Trash2 size={16}/></button></div></div>)}</div> : <div className="p-10 text-center"><Users size={28} className="mx-auto text-[#b5bbb5]"/><p className="mt-3 font-semibold">No team members found</p><p className="mt-1 text-sm text-[#929991]">Add a member or adjust your search and filter.</p></div>}</div>
  </div>;
}
