"use client";

import { ArrowLeft, Download, Eye, FileSpreadsheet, FileText, Film, ImagePlus, Images, LoaderCircle, Music, Pencil, Plus, RotateCcw, Save, Share2, Trash2, Upload, Video, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminSectionTabs } from "@/components/admin-section-tabs";
import { formatFestivalDate, formatFestivalDateTime, formatFestivalTime, toFestivalDateTimeLocal, toFestivalTimestamp } from "@/lib/festival-date-time";
import { getReceiptImagePath, getReceiptPath, getReceiptPdfPath } from "@/lib/receipt-links";

export type AdminModuleName = "donations" | "expenses" | "events" | "volunteers" | "images" | "videos" | "audios" | "announcements" | "sponsors" | "auctions";
type FieldKind = "text" | "tel" | "textarea" | "number" | "date" | "time" | "datetime-local" | "select" | "checkbox";
type Field = { key: string; label: string; kind?: FieldKind; required?: boolean; options?: string[]; accept?: string; defaultValue?: string | number | boolean };
type Config = { title: string; description: string; table: string; fields: Field[] };
type Row = { id: string; [key: string]: unknown };
type FormValues = Record<string, string | number | boolean>;

const configs: Record<AdminModuleName, Config> = {
  donations: {
    title: "Donations",
    description: "Save donations and automatically send receipts by WhatsApp and SMS when payment is marked Received.",
    table: "donations",
    fields: [
      { key: "donor_name", label: "Donor name", required: true }, { key: "donor_phone", label: "Mobile number", kind: "tel", required: true },
      { key: "plot_flat", label: "Plot / flat" },
      { key: "amount", label: "Amount (INR)", kind: "number", required: true },
      { key: "payment_status", label: "Payment status", kind: "select", options: ["received", "pending"], required: true, defaultValue: "received" },
      { key: "received_at", label: "Donation date", kind: "datetime-local" },
      { key: "payment_method", label: "Payment mode", kind: "select", options: ["UPI", "Cash", "Bank transfer", "Other"], required: true, defaultValue: "UPI" },
      { key: "show_on_wall", label: "Donor agreed to public recognition", kind: "checkbox", defaultValue: false },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
  },
  expenses: {
    title: "Expense tracking",
    description: "Record festival spending with the category, payee, date and exact time.",
    table: "expenses",
    fields: [
      { key: "category", label: "Category", required: true }, { key: "description", label: "Description", required: true },
      { key: "paid_to", label: "Paid to" },
      { key: "amount", label: "Amount (INR)", kind: "number", required: true },
      { key: "spent_at", label: "Expense date", kind: "date", required: true },
      { key: "spent_at_time", label: "Expense time", kind: "time", required: true },
      { key: "receipt_url", label: "Receipt URL" },
    ],
  },
  events: {
    title: "Event programme",
    description: "Schedule aarti, bhajans, cultural programmes and prasad distribution.",
    table: "events",
    fields: [
      { key: "title", label: "Event title", required: true }, { key: "description", label: "Description", kind: "textarea" },
      { key: "location", label: "Location" }, { key: "starts_at", label: "Starts at", kind: "datetime-local", required: true },
      { key: "ends_at", label: "Ends at", kind: "datetime-local" }, { key: "is_published", label: "Publish on public website", kind: "checkbox" },
    ],
  },
  volunteers: {
    title: "Volunteer applications",
    description: "Review registrations and approve or decline seva applications.",
    table: "volunteers",
    fields: [
      { key: "name", label: "Name", required: true }, { key: "phone", label: "Mobile", required: true },
      { key: "email", label: "Email" }, { key: "skills", label: "Skills" }, { key: "availability", label: "Availability" },
      { key: "status", label: "Application status", kind: "select", options: ["pending", "approved", "declined"], required: true },
    ],
  },
  images: {
    title: "Photo gallery",
    description: "Upload festival photographs, add helpful alt text and publish selected memories.",
    table: "gallery_images",
    fields: [
      { key: "title", label: "Title", required: true }, { key: "description", label: "Description", kind: "textarea" },
      { key: "image_url", label: "Image file", kind: "text", required: true, accept: "image/jpeg,image/png,image/webp" },
      { key: "alt_text", label: "Accessible image description", required: true },
      { key: "category", label: "Category", kind: "select", options: ["Ganesh Idol", "Decorations", "Aarti", "Cultural Programs", "Competitions", "Volunteers", "Procession", "Immersion", "Previous Years"], required: true },
      { key: "sort_order", label: "Display order", kind: "number", defaultValue: 0 }, { key: "is_published", label: "Publish on public website", kind: "checkbox" },
    ],
  },
  videos: {
    title: "Video gallery",
    description: "Upload video highlights and an optional poster image for the public gallery.",
    table: "gallery_videos",
    fields: [
      { key: "title", label: "Title", required: true }, { key: "description", label: "Description", kind: "textarea" },
      { key: "video_url", label: "Video file", required: true, accept: "video/mp4,video/webm" },
      { key: "poster_url", label: "Poster image", accept: "image/jpeg,image/png,image/webp" },
      { key: "category", label: "Category", kind: "select", options: ["Ganesh Idol", "Decorations", "Aarti", "Cultural Programs", "Competitions", "Volunteers", "Procession", "Immersion", "Previous Years"], required: true },
      { key: "is_published", label: "Publish on public website", kind: "checkbox" },
    ],
  },
  audios: {
    title: "Festival audio",
    description: "Upload bhajans, aarti recordings and other downloadable audio.",
    table: "gallery_audios",
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "audio_url", label: "Audio file", required: true, accept: "audio/mpeg,audio/mp3,audio/wav,audio/mp4,audio/aac,audio/ogg" },
      { key: "category", label: "Category", kind: "select", options: ["Aarti", "Bhajan", "Chant", "Festival", "Previous Years"], required: true },
      { key: "is_published", label: "Publish on public website", kind: "checkbox" },
    ],
  },
  announcements: {
    title: "Announcements",
    description: "Publish notices for visitors and schedule when they appear.",
    table: "announcements",
    fields: [
      { key: "title", label: "Headline", required: true }, { key: "body", label: "Announcement", kind: "textarea", required: true },
      { key: "starts_at", label: "Publish from", kind: "datetime-local", required: true }, { key: "ends_at", label: "Hide after", kind: "datetime-local" },
      { key: "is_published", label: "Publish announcement", kind: "checkbox" },
    ],
  },
  sponsors: {
    title: "Sponsors & partners",
    description: "Thank the businesses and neighbours who help make the celebration possible.",
    table: "sponsors",
    fields: [
      { key: "name", label: "Sponsor name", required: true }, { key: "plot_flat", label: "Plot / flat" },
      { key: "logo_url", label: "Sponsor image", accept: "image/jpeg,image/png,image/webp" },
      { key: "website_url", label: "Website URL" }, { key: "tier", label: "Sponsorship tier", required: true },
      { key: "contribution_amount", label: "Contribution (INR)", kind: "number" },
      { key: "description", label: "Description", kind: "textarea" }, { key: "sort_order", label: "Display order", kind: "number", defaultValue: 0 },
      { key: "is_published", label: "Show on public website", kind: "checkbox" },
    ],
  },
  auctions: {
    title: "Prasad auctions",
    description: "Manage published auction records and their yearly outcomes.",
    table: "auction_items",
    fields: [
      { key: "title", label: "Auction title", required: true },
      { key: "auction_type", label: "Auction category", kind: "select", options: ["laddu_first", "laddu_second", "laddu_third", "kalasam_winner", "laddu", "kalasam", "coconut", "other"], required: true },
      { key: "festival_year", label: "Festival year", kind: "number", required: true, defaultValue: 2027 },
      { key: "plot_flat", label: "Plot / flat" },
      { key: "description", label: "Description", kind: "textarea" }, { key: "scheduled_at", label: "Auction time", kind: "datetime-local" },
      { key: "winning_amount", label: "Winning amount (INR)", kind: "number" }, { key: "winner_name", label: "Winner name" },
      { key: "winner_image_url", label: "Winner image", accept: "image/jpeg,image/png,image/webp" },
      { key: "winner_consent", label: "Winner agreed to be publicly identified (name / photo)", kind: "checkbox" },
      { key: "is_published", label: "Publish on public website", kind: "checkbox" },
    ],
  },
};

const auctionCategoryLabels: Record<string, string> = {
  laddu_first: "1st Laddu Winner",
  laddu_second: "2nd Laddu Winner",
  laddu_third: "3rd Laddu Winner",
  kalasam_winner: "Kalasam Winner",
  laddu: "Laddu (Legacy)",
  kalasam: "Kalasam (Legacy)",
  coconut: "Coconut",
  other: "Other",
};

function initialValues(config: Config, row?: Partial<Row>): FormValues {
  return Object.fromEntries(config.fields.map((field) => {
    const raw = row?.[field.key];
    if (field.kind === "checkbox") return [field.key, raw == null ? Boolean(field.defaultValue) : Boolean(raw)];
    if (field.kind === "datetime-local" && typeof raw === "string") return [field.key, toFestivalDateTimeLocal(raw)];
    if (field.kind === "date" && typeof raw === "string") return [field.key, raw.slice(0, 10)];
    if (field.kind === "time" && typeof raw === "string") return [field.key, raw.slice(0, 5)];
    return [field.key, raw == null ? field.defaultValue ?? "" : String(raw)];
  }));
}

function escapeCsv(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function getRecordErrorMessage(error: unknown, fallback: string, table: string) {
  const message = typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
    ? error.message
    : error instanceof Error ? error.message : "";
  const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
    ? error.code
    : "";
  if (code === "42501") {
    return "Supabase denied this change. Confirm your account has an admin role and the table policies are installed.";
  }
  if (["PGRST204", "PGRST205", "42P01", "42703"].includes(code)) {
    if (table === "donations") {
      return "The donation receipt schema is incomplete. In Supabase SQL Editor, run database/migrations/20261119_add_donation_payment_status.sql and database/migrations/20261120_add_donation_receipts.sql. If the donations table is missing, run database/schema.sql first.";
    }
    if (table === "expenses") {
      return "The expense date/time schema is incomplete. In Supabase SQL Editor, run database/migrations/20261120_add_expense_time.sql, then retry. If the expenses table is missing, run database/schema.sql first.";
    }
    if (table === "auction_items") {
      return "The auction archive schema is incomplete. In Supabase SQL Editor, run database/migrations/20261119_add_auction_archive_fields.sql and database/migrations/20261120_add_auction_winner_images.sql, then retry. If the auction_items table is missing, run database/schema.sql first.";
    }
    if (table === "gallery_audios") {
      return "The festival audio schema is missing. In Supabase SQL Editor, run database/migrations/20261119_add_gallery_audios.sql, then retry.";
    }
    return "The Supabase table or field is missing. Apply the latest database schema and migrations, then retry.";
  }
  const details = typeof error === "object" && error !== null && "details" in error && typeof error.details === "string"
    ? error.details
    : "";
  const hint = typeof error === "object" && error !== null && "hint" in error && typeof error.hint === "string"
    ? error.hint
    : "";
  return [message || fallback, details, hint].filter(Boolean).join(" ");
}

function getRecordErrorLog(error: unknown) {
  if (typeof error !== "object" || error === null) return { error };

  const log: Record<string, unknown> = {};
  for (const key of ["name", "message", "code", "details", "hint", "status", "statusCode"]) {
    if (key in error) {
      log[key] = error[key as keyof typeof error];
    }
  }
  return Object.keys(log).length ? log : { error: String(error) };
}

async function fetchAllRows(supabase: ReturnType<typeof createClient>, table: string) {
  const rows: Row[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: true }).range(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as Row[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export function ModuleManager({ moduleName, compact = false, festivalYear }: { moduleName: AdminModuleName; compact?: boolean; festivalYear?: number }) {
  const router = useRouter();
  const config = useMemo(() => configs[moduleName], [moduleName]);
  const [records, setRecords] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [values, setValues] = useState<FormValues>(() => initialValues(config));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [galleryCategory, setGalleryCategory] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<Row | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [audioCount, setAudioCount] = useState(0);
  const [exportingWorkbook, setExportingWorkbook] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase.from(config.table).select("*").order("created_at", { ascending: false }).limit(100);
      if (moduleName === "auctions" && festivalYear) {
        query = query.eq("festival_year", festivalYear);
      }
      const { data, error } = await query;
      if (error) throw error;
      setRecords((data ?? []) as Row[]);
      if (moduleName === "images" || moduleName === "videos" || moduleName === "audios") {
        const [photos, videos, audios] = await Promise.all([
          supabase.from("gallery_images").select("id", { count: "exact", head: true }),
          supabase.from("gallery_videos").select("id", { count: "exact", head: true }),
          supabase.from("gallery_audios").select("id", { count: "exact", head: true }),
        ]);
        setPhotoCount(photos.count ?? 0);
        setVideoCount(videos.count ?? 0);
        setAudioCount(audios.count ?? 0);
      }
    } catch (error) {
      console.error(`Could not load ${config.title.toLowerCase()}:`, error);
      setMessage(getRecordErrorMessage(error, "The records could not be loaded.", config.table));
    } finally {
      setLoading(false);
    }
  }, [config, festivalYear, moduleName]);

  useEffect(() => { void loadRecords(); }, [loadRecords]);

  function startCreate() {
    setEditing(null);
    setValues(initialValues(config, festivalYear && moduleName === "auctions"
      ? { festival_year: festivalYear }
      : undefined));
    setFormOpen(true);
    setMessage("");
  }

  function startEdit(row: Row) {
    setEditing(row);
    setValues(initialValues(config, row));
    setFormOpen(true);
    setMessage("");
  }

  function updateField(key: string, value: string | number | boolean) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function uploadFile(field: Field, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setMessage("Files must be 50 MB or smaller.");
      return;
    }
    setMessage(`Uploading ${file.name}…`);
    try {
      const supabase = createClient();
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const filePath = `${moduleName}/${crypto.randomUUID()}-${cleanName}`;
      const { error } = await supabase.storage.from("festival-media").upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("festival-media").getPublicUrl(filePath);
      updateField(field.key, data.publicUrl);
      setMessage(`${file.name} uploaded. Save this record to publish the link.`);
    } catch (error) {
      console.error("Festival media upload failed:", error);
      setMessage(error instanceof Error ? error.message : "The file could not be uploaded.");
    }
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const payload: Record<string, string | number | boolean | null> = {};
    for (const field of config.fields) {
      const value = values[field.key];
      if (field.kind === "checkbox") payload[field.key] = Boolean(value);
      else if (field.kind === "number") {
        const numberValue = value === "" ? field.defaultValue : value;
        payload[field.key] = numberValue == null ? null : Number(numberValue);
      }
      else if (field.kind === "datetime-local" && value !== "") payload[field.key] = toFestivalTimestamp(String(value));
      else if (value !== "") payload[field.key] = String(value);
    }

    try {
      let savedRecord: Row;
      if (moduleName === "donations") {
        const response = await fetch(editing ? `/api/admin/donations/${encodeURIComponent(editing.id)}` : "/api/admin/donations", {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || "The donation could not be saved.");
        savedRecord = result.donation as Row;
        setMessage(result.warning || result.message || (editing ? "Donation updated." : "Donation saved."));
      } else {
        const supabase = createClient();
        if (moduleName === "volunteers" && editing && values.status !== editing.status) {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          if (user) {
            payload.reviewed_by = user.id;
            payload.reviewed_at = new Date().toISOString();
          }
        }
        if (editing) {
          const { data, error } = await supabase.from(config.table).update(payload).eq("id", editing.id).select("*").single();
          if (error) throw error;
          savedRecord = data as Row;
        } else {
          const { data, error } = await supabase.from(config.table).insert(payload).select("*").single();
          if (error) throw error;
          savedRecord = data as Row;
        }
      }

      setRecords((current) => editing
        ? current.map((record) => record.id === savedRecord.id ? savedRecord : record)
        : [savedRecord, ...current.filter((record) => record.id !== savedRecord.id)].slice(0, 100));
      if (moduleName !== "donations") setMessage(editing ? "Record updated." : "Record added.");
      setEditing(null);
      setValues({});
      setFormOpen(false);
      router.refresh();
      if (moduleName === "donations") await loadRecords();
    } catch (error) {
      console.error(`Could not save ${config.title.toLowerCase()}:`, getRecordErrorLog(error));
      setMessage(getRecordErrorMessage(error, "The record could not be saved.", config.table));
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(row: Row) {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from(config.table).delete().eq("id", row.id).select("id").single();
      if (error) throw error;
      setRecords((current) => current.filter((record) => record.id !== row.id));
      setMessage("Record deleted.");
      router.refresh();
      if (editing?.id === row.id) {
        setEditing(null);
        setValues({});
        setFormOpen(false);
      }
    } catch (error) {
      console.error(`Could not delete ${config.title.toLowerCase()} record:`, error);
      setMessage(getRecordErrorMessage(error, "The record could not be deleted.", config.table));
    }
  }

  async function retryReceiptDelivery(row: Row) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/donations/${encodeURIComponent(row.id)}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Receipt delivery could not be retried.");
      setRecords((current) => current.map((record) => record.id === row.id ? result.donation as Row : record));
      setMessage(result.message || "Receipt delivery attempted.");
      await loadRecords();
    } catch (error) {
      console.error("Could not retry donation receipt delivery:", getRecordErrorLog(error));
      setMessage(error instanceof Error ? error.message : "Receipt delivery could not be retried.");
    } finally {
      setSaving(false);
    }
  }

  async function shareReceiptPng(receiptNo: string, receiptToken: string) {
    const fileName = `SGU-donation-certificate-${receiptNo.replace(/[^A-Za-z0-9-]+/g, "-")}.png`;
    try {
      const response = await fetch(getReceiptImagePath(receiptNo, receiptToken), { cache: "no-store" });
      if (!response.ok) throw new Error("The certificate PNG could not be loaded.");
      const image = await response.blob();
      const file = new File([image], fileName, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Suryodaya Colony Ganesh Utsav donation certificate" });
        setMessage("Certificate PNG shared.");
        return;
      }

      const imageUrl = URL.createObjectURL(image);
      const anchor = document.createElement("a");
      anchor.href = imageUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
      setMessage("Certificate PNG downloaded. Attach it to WhatsApp to share.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Could not share donation certificate PNG:", getRecordErrorLog(error));
      setMessage(error instanceof Error ? error.message : "The certificate PNG could not be shared.");
    }
  }

  async function uploadMultipleGalleryFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;
    const isVideoUpload = moduleName === "videos";
    const isAudioUpload = moduleName === "audios";
    const allowed = isVideoUpload
      ? ["video/mp4", "video/webm"]
      : isAudioUpload
        ? ["audio/mpeg", "audio/mp3", "audio/wav", "audio/mp4", "audio/aac", "audio/ogg"]
        : ["image/jpeg", "image/png", "image/webp"];
    const validFiles = fileArray.filter((file) => allowed.includes(file.type) && file.size <= 50 * 1024 * 1024);
    if (!validFiles.length) {
      setMessage(isVideoUpload ? "Choose MP4 or WebM video files under 50 MB." : isAudioUpload ? "Choose MP3, WAV, AAC or OGG audio files under 50 MB." : "Choose JPG, PNG or WebP images under 50 MB.");
      return;
    }

    setSaving(true);
    setMessage(`Uploading ${validFiles.length} ${isAudioUpload ? "audio file" : isVideoUpload ? "video" : "photo"}${validFiles.length === 1 ? "" : "s"}…`);
    try {
      const supabase = createClient();
      const rows: Record<string, string | number | boolean>[] = [];
      for (const file of validFiles) {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const filePath = `${moduleName}/${crypto.randomUUID()}-${cleanName}`;
        const { error: uploadError } = await supabase.storage.from("festival-media").upload(filePath, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("festival-media").getPublicUrl(filePath);
        const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Festival media";
        const category = galleryCategory === "All" ? "Ganesh Idol" : galleryCategory;
        rows.push(isVideoUpload
          ? { title, video_url: data.publicUrl, category, is_published: true }
          : isAudioUpload
            ? { title, audio_url: data.publicUrl, category, is_published: true }
            : { title, image_url: data.publicUrl, alt_text: title, category, sort_order: 0, is_published: true });
      }
      const { error: insertError } = await supabase.from(config.table).insert(rows);
      if (insertError) throw insertError;
      setMessage(`${validFiles.length} ${isAudioUpload ? "audio file" : isVideoUpload ? "video" : "photo"}${validFiles.length === 1 ? " uploaded" : "s uploaded"}.`);
      await loadRecords();
      router.refresh();
    } catch (error) {
      console.error("Could not upload gallery media:", getRecordErrorLog(error));
      setMessage(getRecordErrorMessage(error, "The gallery upload could not be completed.", config.table));
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelected() {
    if (!selectedIds.size || !window.confirm(`Delete ${selectedIds.size} selected record${selectedIds.size === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setSaving(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from(config.table).delete().in("id", Array.from(selectedIds));
      if (error) throw error;
      setRecords((current) => current.filter((record) => !selectedIds.has(String(record.id))));
      setSelectedIds(new Set());
      setMessage("Selected records deleted.");
      await loadRecords();
      router.refresh();
    } catch (error) {
      console.error("Could not delete selected gallery records:", getRecordErrorLog(error));
      setMessage(getRecordErrorMessage(error, "The selected records could not be deleted.", config.table));
    } finally {
      setSaving(false);
    }
  }

  async function exportCsv() {
    try {
      const exportFields = moduleName === "donations"
        ? [
          ...config.fields.filter((field) => field.key !== "show_on_wall"),
          { key: "receipt_no", label: "Receipt number" },
        ]
        : config.fields;
      let exportRecords = records;
      if (moduleName === "donations" || moduleName === "expenses") {
        exportRecords = await fetchAllRows(createClient(), config.table);
      }
      if (moduleName === "auctions" && festivalYear) {
        exportRecords = exportRecords.filter((record) => Number(record.festival_year) === festivalYear);
      }
      const rows = exportRecords.map((record) => exportFields.map((field) => escapeCsv(
        field.key === "auction_type" ? auctionCategoryLabels[String(record[field.key])] ?? record[field.key]
          : field.key === "payment_status" ? (record[field.key] === "received" ? "Received" : "Yet to be received")
            : field.kind === "date" && record[field.key] ? formatFestivalDate(String(record[field.key]))
              : field.kind === "time" ? formatFestivalTime(record[field.key] == null ? null : String(record[field.key]))
            : record[field.key],
      )).join(","));
      if (moduleName === "donations") {
        const received = exportRecords.reduce((sum, record) => record.payment_status === "received" ? sum + Number(record.amount ?? 0) : sum, 0);
        const total = exportFields.map(() => "");
        total[exportFields.findIndex((field) => field.key === "donor_name")] = escapeCsv("Total donations received");
        total[exportFields.findIndex((field) => field.key === "amount")] = escapeCsv(received);
        rows.push(total.join(","));
      } else if (moduleName === "expenses") {
        const totalAmount = exportRecords.reduce((sum, record) => sum + Number(record.amount ?? 0), 0);
        const total = exportFields.map(() => "");
        total[exportFields.findIndex((field) => field.key === "description")] = escapeCsv("Total expenditure");
        total[exportFields.findIndex((field) => field.key === "amount")] = escapeCsv(totalAmount);
        rows.push(total.join(","));
      }
      const header = exportFields.map((field) => escapeCsv(field.label)).join(",");
      const blob = new Blob([[header, ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ganesh-utsav-${moduleName}${festivalYear ? `-${festivalYear}` : ""}.csv`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error(`Could not export ${config.title.toLowerCase()} CSV:`, getRecordErrorLog(error));
      setMessage(getRecordErrorMessage(error, "The CSV could not be generated.", config.table));
    }
  }

  async function exportFinanceWorkbook() {
    setExportingWorkbook(true);
    setMessage("");
    try {
      const supabase = createClient();
      const [donations, expenses, sponsors, auctions] = await Promise.all([
        fetchAllRows(supabase, "donations"),
        fetchAllRows(supabase, "expenses"),
        fetchAllRows(supabase, "sponsors"),
        fetchAllRows(supabase, "auction_items"),
      ]);
      const { default: ExcelJS } = await import("exceljs/dist/exceljs.min.js");
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Ganesh Utsav Committee";
      workbook.created = new Date();

      const donationRows = donations.map((record) => ({
        plot: record.plot_flat ?? "",
        donor: record.donor_name ?? "",
        mobile: record.donor_phone ?? "",
        amount: Number(record.amount ?? 0),
        status: record.payment_status === "received" ? "Received" : "Yet to be received",
        contribution: record.notes ?? "",
        date: record.received_at ? new Date(String(record.received_at)) : record.created_at ? new Date(String(record.created_at)) : "",
        method: record.payment_method ?? "",
      }));
      const donationsTotal = donations.reduce((total, record) => (
        record.payment_status === "received" ? total + Number(record.amount ?? 0) : total
      ), 0);

      const donationSheet = workbook.addWorksheet("Donations");
      donationSheet.columns = [
        { header: "Plot No.", key: "plot", width: 18 },
        { header: "Donor Name", key: "donor", width: 26 },
        { header: "Mobile", key: "mobile", width: 17 },
        { header: "Amount (INR)", key: "amount", width: 16 },
        { header: "Status", key: "status", width: 18 },
        { header: "Contribution Type / Notes", key: "contribution", width: 32 },
        { header: "Date", key: "date", width: 16 },
        { header: "Payment Mode", key: "method", width: 18 },
      ];
      donationSheet.addRows(donationRows);
      donationSheet.getColumn(4).numFmt = '"₹"#,##0.00';
      donationSheet.getColumn(7).numFmt = "dd-mmm-yyyy";
      donationSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const statusCell = row.getCell(5);
        if (statusCell.value === "Received") {
          statusCell.font = { bold: true, color: { argb: "FF166534" } };
          statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
        } else if (statusCell.value === "Yet to be received") {
          statusCell.font = { bold: true, color: { argb: "FF92400E" } };
          statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
        }
      });
      const donationEnd = donationSheet.rowCount;
      const donationTotalRow = donationSheet.addRow([]);
      donationTotalRow.getCell(1).value = "Total Donations Received";
      donationTotalRow.getCell(4).value = donationRows.length
        ? { formula: `SUMIF(E2:E${donationEnd},"Received",D2:D${donationEnd})`, result: donationsTotal }
        : donationsTotal;

      const expenseRows = expenses.map((record) => ({
        description: record.description ?? "",
        category: record.category ?? "",
        paidTo: record.paid_to ?? "",
        amount: Number(record.amount ?? 0),
        date: record.spent_at ? new Date(`${String(record.spent_at)}T00:00:00+05:30`) : record.created_at ? new Date(String(record.created_at)) : "",
        time: formatFestivalTime(record.spent_at_time == null ? null : String(record.spent_at_time)),
        receipt: record.receipt_url ?? "",
      }));
      const expensesTotal = expenseRows.reduce((total, record) => total + record.amount, 0);
      const expenseSheet = workbook.addWorksheet("Expenditure");
      expenseSheet.columns = [
        { header: "Expense Name", key: "description", width: 34 },
        { header: "Category", key: "category", width: 20 },
        { header: "Paid To", key: "paidTo", width: 26 },
        { header: "Amount (INR)", key: "amount", width: 16 },
        { header: "Date", key: "date", width: 16 },
        { header: "Time", key: "time", width: 18 },
        { header: "Receipt URL", key: "receipt", width: 40 },
      ];
      expenseSheet.addRows(expenseRows);
      expenseSheet.getColumn(4).numFmt = '"₹"#,##0.00';
      expenseSheet.getColumn(5).numFmt = "dd-mmm-yyyy";
      const expenseEnd = expenseSheet.rowCount;
      const expenseTotalRow = expenseSheet.addRow([]);
      expenseTotalRow.getCell(1).value = "Total Expenditure";
      expenseTotalRow.getCell(4).value = expenseRows.length
        ? { formula: `SUM(D2:D${expenseEnd})`, result: expensesTotal }
        : expensesTotal;

      const sponsorshipTotal = sponsors.reduce((total, record) => total + Number(record.contribution_amount ?? 0), 0);
      const auctionTotal = auctions.reduce((total, record) => total + Number(record.winning_amount ?? 0), 0);
      const totalIncome = donationsTotal + sponsorshipTotal + auctionTotal;
      const remainingBalance = totalIncome - expensesTotal;
      const balanceSheet = workbook.addWorksheet("Remaining Balance");
      balanceSheet.columns = [
        { header: "Finance Summary", key: "label", width: 38 },
        { header: "Amount (INR)", key: "amount", width: 22 },
      ];
      balanceSheet.addRows([
        { label: "Received Donations", amount: donationsTotal },
        { label: "Sponsorship Income", amount: sponsorshipTotal },
        { label: "Auction Amount", amount: auctionTotal },
        { label: "Total Income", amount: { formula: "SUM(B2:B4)", result: totalIncome } },
        { label: "Total Expenditure", amount: expensesTotal },
        { label: "Remaining Balance", amount: { formula: "B5-B6", result: remainingBalance } },
      ]);
      balanceSheet.getColumn(2).numFmt = '"₹"#,##0.00';

      for (const sheet of [donationSheet, expenseSheet, balanceSheet]) {
        sheet.views = [{ state: "frozen", ySplit: 1 }];
        sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A3516" } };
        sheet.autoFilter = { from: "A1", to: `${sheet.getColumn(sheet.columnCount).letter}1` };
        sheet.eachRow((row, rowNumber) => {
          const label = String(row.getCell(1).value ?? "");
          if (rowNumber > 1 && (label.startsWith("Total") || label === "Remaining Balance")) {
            row.font = { bold: true };
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.border = { top: { style: "thin", color: { argb: "FFE0B13E" } } };
            });
          }
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ganesh-utsav-finance-${new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Finance workbook downloaded.");
    } catch (error) {
      console.error("Could not export finance workbook:", getRecordErrorLog(error));
      setMessage(getRecordErrorMessage(error, "The finance workbook could not be generated.", "donations"));
    } finally {
      setExportingWorkbook(false);
    }
  }

  const filteredRecords = records.filter((record) => config.fields.some((field) => String(record[field.key] ?? "").toLowerCase().includes(search.toLowerCase())));
  const tableFields: Field[] = moduleName === "donations"
    ? [
      ...config.fields.filter((field) => field.key !== "show_on_wall" && field.key !== "notes"),
      { key: "receipt_no", label: "Receipt number" },
    ]
    : config.fields.filter((field) => moduleName !== "expenses" || field.key !== "spent_at_time");
  const Root = compact ? "section" : "main";
  const paymentStatusLabels: Record<string, string> = { received: "Received", pending: "Yet to be received" };
  const isGallery = moduleName === "images" || moduleName === "videos" || moduleName === "audios";
  const galleryCategories = ["All", "Ganesh Idol", "Decorations", "Aarti", "Cultural Programs", "Competitions", "Volunteers", "Procession", "Immersion", "Previous Years"];
  const galleryFilteredRecords = filteredRecords.filter((record) => galleryCategory === "All" || String(record.category ?? "") === galleryCategory);
  const publishedGalleryCount = records.filter((record) => Boolean(record.is_published)).length;

  return (
    <Root id={compact ? "donations" : undefined} className={`admin-dashboard module-dashboard${compact ? " module-compact" : ""}`}>
      {!compact && <header className="admin-topbar"><span><Link href="/">SURYODAYA COLONY</Link> / <strong>{config.title.toUpperCase()}</strong></span><Link href="/" target="_blank" rel="noreferrer">View public site</Link></header>}
      <AdminSectionTabs active={moduleName === "auctions" ? (festivalYear === 2026 ? "auctions-2026" : "auctions-current") : moduleName} />
      {!compact && <div className="module-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> COMMITTEE WORKSPACE{festivalYear ? ` · ${festivalYear} AUCTION ARCHIVE` : ""}</p><h1>{moduleName === "auctions" ? (festivalYear === 2026 ? "2026 Auction Archive" : "Prasad auctions") : config.title}</h1><p>{moduleName === "auctions" ? (festivalYear === 2026 ? "Historical Laddu, Kalasam and other auction winners from 2026." : "Manage published Laddu, Kalasam and other auction outcomes.") : config.description}</p></div><Link href="/admin" className="module-back"><ArrowLeft size={14} /> Dashboard</Link></div>}
      <div className="module-toolbar">
        <input aria-label={`Search ${config.title}`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records…" />
        {moduleName === "donations" && <button type="button" onClick={() => void exportFinanceWorkbook()} disabled={exportingWorkbook}><FileSpreadsheet size={15} /> {exportingWorkbook ? "Preparing Excel…" : "Export Excel"}</button>}
        <button type="button" onClick={() => void exportCsv()} disabled={!records.length}><Download size={15} /> Export CSV</button>
        {isGallery && <Link className="gallery-switch-button" href={moduleName === "images" ? "/admin/manage/videos" : moduleName === "videos" ? "/admin/manage/audios" : "/admin/manage/images"}>{moduleName === "images" ? <Video size={15} /> : moduleName === "videos" ? <Music size={15} /> : <Images size={15} />}{moduleName === "images" ? "Manage videos" : moduleName === "videos" ? "Manage audio" : "Manage photos"}</Link>}
        {isGallery ? (
          <>
            <input
              ref={galleryFileInputRef}
              className="gallery-native-file-input"
              type="file"
              accept={moduleName === "images" ? "image/jpeg,image/png,image/webp" : moduleName === "videos" ? "video/mp4,video/webm" : "audio/mpeg,audio/mp3,audio/wav,audio/mp4,audio/aac,audio/ogg"}
              multiple
              onChange={(event) => {
                if (event.target.files) void uploadMultipleGalleryFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <button type="button" className="module-add-button" onClick={() => galleryFileInputRef.current?.click()}>
              <Plus size={16} /> {moduleName === "images" ? "Upload image" : moduleName === "videos" ? "Upload video" : "Upload audio"}
            </button>
          </>
        ) : (
          <button type="button" className="module-add-button" onClick={startCreate}><Plus size={16} /> Add record</button>
        )}
      </div>
      {isGallery && (
        <section className="gallery-admin">
          <div className="gallery-admin-summary">
            <article><span><Images size={15} /> Total Photos</span><strong>{photoCount}</strong></article>
            <article><span><Film size={15} /> Total Videos</span><strong>{videoCount}</strong></article>
            <article><span><Music size={15} /> Total Audio</span><strong>{audioCount}</strong></article>
            <article><span><Upload size={15} /> Published</span><strong>{publishedGalleryCount}</strong></article>
          </div>
          <label
            className="gallery-dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); void uploadMultipleGalleryFiles(event.dataTransfer.files); }}
          >
            <input type="file" accept={moduleName === "images" ? "image/jpeg,image/png,image/webp" : moduleName === "videos" ? "video/mp4,video/webm" : "audio/mpeg,audio/mp3,audio/wav,audio/mp4,audio/aac,audio/ogg"} multiple onChange={(event) => { if (event.target.files) void uploadMultipleGalleryFiles(event.target.files); event.target.value = ""; }} />
            <Upload size={19} />
            <div><strong>{moduleName === "images" ? "Drop photos here or browse" : moduleName === "videos" ? "Drop videos here or browse" : "Drop audio here or browse"}</strong><span>Published to the public page automatically · {moduleName === "images" ? "JPG, PNG or WebP" : moduleName === "videos" ? "MP4 or WebM" : "MP3, WAV, AAC or OGG"} · up to 50 MB each</span></div>
          </label>
          <div className="gallery-filter-row">
            <div className="gallery-category-tabs" aria-label="Gallery categories">
              {galleryCategories.map((category) => (
                <button type="button" className={galleryCategory === category ? "active" : ""} onClick={() => setGalleryCategory(category)} key={category}>{category}</button>
              ))}
            </div>
            {selectedIds.size > 0 && <button type="button" className="gallery-bulk-delete" onClick={() => void deleteSelected()} disabled={saving}><Trash2 size={14} /> Delete {selectedIds.size}</button>}
          </div>
        </section>
      )}
      {message && <p className="module-message" role="status">{message}</p>}
      {formOpen ? (
        <form className="module-form" onSubmit={saveRecord}>
          <div className="module-form-heading"><h2>{editing ? "Edit record" : "Add a record"}</h2><button type="button" onClick={() => { setEditing(null); setValues({}); setFormOpen(false); }} aria-label="Close form"><X size={16} /></button></div>
          <div className="module-form-grid">
            {config.fields.map((field) => {
              const timeParts = String(values[field.key] ?? "").split(":");
              return (
                <label className={`module-field${field.kind === "textarea" ? " module-field-wide" : ""}${field.kind === "checkbox" ? " module-checkbox" : ""}`} key={field.key}>
                  {field.kind === "checkbox" ? (
                    <><input type="checkbox" checked={Boolean(values[field.key])} onChange={(event) => updateField(field.key, event.target.checked)} /><span>{field.label}</span></>
                  ) : (
                    <>
                      <span>{field.label}{field.required && " *"}</span>
                      {field.kind === "textarea" ? <textarea value={String(values[field.key] ?? "")} required={field.required} onChange={(event) => updateField(field.key, event.target.value)} /> : field.kind === "time" ? (
                        <div className="module-time-picker">
                          <select aria-label={`${field.label} hour`} value={timeParts[0] ?? ""} required={field.required} onChange={(event) => updateField(field.key, `${event.target.value}:${timeParts[1] ?? ""}`)}>
                            <option value="">HH</option>{Array.from({ length: 24 }, (_, hour) => {
                              const value = String(hour).padStart(2, "0");
                              return <option key={value} value={value}>{value}</option>;
                            })}
                          </select>
                          <span>:</span>
                          <select aria-label={`${field.label} minute`} value={timeParts[1] ?? ""} required={field.required} onChange={(event) => updateField(field.key, `${timeParts[0] ?? ""}:${event.target.value}`)}>
                            <option value="">MM</option>{Array.from({ length: 60 }, (_, minute) => {
                              const value = String(minute).padStart(2, "0");
                              return <option key={value} value={value}>{value}</option>;
                            })}
                          </select>
                        </div>
                      ) : field.kind === "select" ? (
                        <select value={String(values[field.key] ?? "")} required={field.required} onChange={(event) => updateField(field.key, event.target.value)}><option value="">Select…</option>{field.options?.map((option) => <option key={option} value={option}>{paymentStatusLabels[option] ?? auctionCategoryLabels[option] ?? option}</option>)}</select>
                      ) : (
                        <input type={field.kind || "text"} value={String(values[field.key] ?? "")} required={field.required} min={field.kind === "number" ? "0" : undefined} step={field.kind === "number" ? "0.01" : undefined} onChange={(event) => updateField(field.key, event.target.value)} />
                      )}
                      {field.accept && <span className="module-file-control"><input type="file" accept={field.accept} aria-label={`Upload ${field.label.toLowerCase()}`} onChange={(event) => void uploadFile(field, event)} /><ImagePlus size={14} /> Upload file to festival media</span>}
                      {["logo_url", "winner_image_url"].includes(field.key) && typeof values[field.key] === "string" && values[field.key] && <Image className="module-image-preview" src={String(values[field.key])} alt={`${field.label} preview`} width={240} height={160} unoptimized />}
                    </>
                  )}
                </label>
              );
            })}
          </div>
          {moduleName === "donations" && <p className="module-note">Received donations trigger both receipt messages automatically. Pending donations are saved without sending.</p>}
          <div className="module-form-actions"><button type="button" onClick={startCreate}>Clear</button><button type="submit" disabled={saving}>{saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}{moduleName === "donations" ? "Save donation" : editing ? "Save changes" : "Add record"}</button></div>
        </form>
      ) : <p className="module-note">Select “Add record” to create a new item.</p>}
      {isGallery ? (
        loading ? <div className="module-loading gallery-loading"><LoaderCircle size={17} className="animate-spin" /> Loading gallery…</div> : galleryFilteredRecords.length ? (
          <div className="gallery-admin-grid">
            {galleryFilteredRecords.map((record) => {
              const imageUrl = moduleName === "images" ? record.image_url : record.poster_url;
              const videoUrl = record.video_url;
              const date = typeof record.created_at === "string" ? new Date(record.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date unavailable";
              return (
                <article className={`gallery-media-card${selectedIds.has(String(record.id)) ? " selected" : ""}`} key={String(record.id)}>
                  <button type="button" className="gallery-card-select" aria-label={`Select ${String(record.title ?? "media")}`} onClick={() => setSelectedIds((current) => { const next = new Set(current); if (next.has(String(record.id))) next.delete(String(record.id)); else next.add(String(record.id)); return next; })}>{selectedIds.has(String(record.id)) ? "✓" : ""}</button>
                  <button type="button" className="gallery-media-preview" onClick={() => setLightbox(record)} aria-label={`Preview ${String(record.title ?? "media")}`}>
                    {moduleName === "images" && typeof imageUrl === "string" ? <Image src={imageUrl} alt={String(record.alt_text ?? record.title ?? "Festival gallery image")} width={640} height={480} unoptimized /> : moduleName === "videos" && typeof videoUrl === "string" ? (typeof imageUrl === "string" ? <Image src={imageUrl} alt={String(record.title ?? "Festival video")} width={640} height={360} unoptimized /> : <div className="gallery-video-placeholder"><Video size={30} /><span>VIDEO</span></div>) : moduleName === "audios" && typeof record.audio_url === "string" ? <div className="gallery-video-placeholder"><Music size={30} /><span>AUDIO</span></div> : <div className="gallery-media-placeholder"><Images size={28} /></div>}
                  </button>
                  <div className="gallery-media-info">
                    <div><strong>{String(record.title ?? "Untitled")}</strong><span>{String(record.category ?? "Uncategorized")}</span></div>
                    <small>{date}</small>
                    <div className="gallery-card-actions"><button type="button" onClick={() => startEdit(record)}>Edit</button><button type="button" className="module-delete" onClick={() => void deleteRecord(record)} aria-label={`Delete ${config.title} record`}><Trash2 size={13} /></button></div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <p className="module-empty gallery-empty">{records.length ? "No media matches this category or search." : "No media yet. Upload the first one above."}</p>
      ) : (
        <div className="module-table-wrap">
          {loading ? <div className="module-loading"><LoaderCircle size={17} className="animate-spin" /> Loading records…</div> : filteredRecords.length ? (
            <table className="module-table">
              <thead><tr>{tableFields.map((field) => <th key={field.key}>{moduleName === "expenses" && field.key === "spent_at" ? "Expense date & time" : field.label}</th>)}<th>Actions</th></tr></thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    {tableFields.map((field) => (
                      <td key={field.key}>
                          {field.key === "receipt_no" && record[field.key] ? record.payment_status === "received" && typeof record.receipt_token === "string"
                            ? <a href={getReceiptPath(String(record[field.key]), record.receipt_token)} target="_blank" rel="noreferrer">{String(record[field.key])} ↗</a>
                            : String(record[field.key])
                            : field.key === "payment_status" ? <span className={`payment-status-badge ${record[field.key] === "received" ? "is-received" : "is-pending"}`}>{paymentStatusLabels[String(record[field.key])] ?? "—"}</span>
                            : field.key === "auction_type" ? (auctionCategoryLabels[String(record[field.key])] ?? "—")
                              : moduleName === "expenses" && field.key === "spent_at" && record.spent_at ? `${formatFestivalDate(String(record.spent_at))} ${formatFestivalTime(record.spent_at_time == null ? null : String(record.spent_at_time))}`
                                : field.kind === "date" && record[field.key] ? formatFestivalDate(String(record[field.key]))
                                  : field.kind === "time" ? formatFestivalTime(record[field.key] == null ? null : String(record[field.key]))
                                    : field.kind === "datetime-local" && record[field.key] ? formatFestivalDateTime(String(record[field.key]))
                                      : field.kind === "checkbox" ? (record[field.key] ? "Yes" : "No")
                                        : (field.key === "winner_image_url" || field.key === "logo_url") && record[field.key] ? <a href={String(record[field.key])} target="_blank" rel="noreferrer">View image ↗</a>
                                          : String(record[field.key] ?? "—")}
                      </td>
                    ))}
                    <td className={moduleName === "donations" ? "donation-admin-actions" : undefined}>
                      <div className="module-table-actions">
                      {moduleName === "donations" && record.payment_status === "received" && typeof record.receipt_no === "string" && typeof record.receipt_token === "string" && (() => {
                        const receiptNo = String(record.receipt_no);
                        const receiptToken = String(record.receipt_token);
                        const receiptPath = getReceiptPath(receiptNo, receiptToken);
                        const imagePath = getReceiptImagePath(receiptNo, receiptToken);
                        const pdfPath = getReceiptPdfPath(receiptNo, receiptToken);
                        const downloadName = `SGU-donation-certificate-${receiptNo.replace(/[^A-Za-z0-9-]+/g, "-")}`;
                        return (
                          <>
                            <a className="table-icon-action" href={receiptPath} target="_blank" rel="noreferrer" aria-label="View receipt" title="View receipt"><Eye size={14} /></a>
                            <a className="table-icon-action" href={imagePath} download={`${downloadName}.png`} aria-label="Download certificate PNG" title="Download PNG"><Download size={14} /></a>
                            <a className="table-icon-action" href={pdfPath} download={`${downloadName}.pdf`} aria-label="Download certificate PDF" title="Download PDF"><FileText size={14} /></a>
                            <button className="table-icon-action" type="button" onClick={() => void shareReceiptPng(receiptNo, receiptToken)} aria-label="Share certificate PNG" title="Share PNG image"><Share2 size={14} /></button>
                            <button className="table-icon-action" type="button" onClick={() => void retryReceiptDelivery(record)} disabled={saving} aria-label="Re-send receipt" title="Re-send receipt"><RotateCcw size={14} /></button>
                          </>
                        );
                      })()}
                      <button className="table-icon-action" type="button" onClick={() => startEdit(record)} aria-label={`Edit ${config.title} record`} title="Edit"><Pencil size={14} /></button>
                      <button type="button" className="table-icon-action module-delete" onClick={() => void deleteRecord(record)} aria-label={`Delete ${config.title} record`} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody></table>
          ) : <p className="module-empty">{records.length ? "No records match that search." : "No records yet. Add the first one above."}</p>}
        </div>
      )}
      {lightbox && (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Media preview">
          <button type="button" className="gallery-lightbox-close" onClick={() => setLightbox(null)} aria-label="Close preview"><X size={19} /></button>
          {moduleName === "images" && typeof lightbox.image_url === "string" ? <Image src={lightbox.image_url} alt={String(lightbox.alt_text ?? lightbox.title ?? "Festival gallery image")} width={1200} height={900} unoptimized /> : typeof lightbox.video_url === "string" ? <video src={lightbox.video_url} controls autoPlay /> : typeof lightbox.audio_url === "string" ? <audio src={lightbox.audio_url} controls autoPlay /> : null}
          <p>{String(lightbox.title ?? "")}</p>
        </div>
      )}
    </Root>
  );
}
