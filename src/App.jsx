import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./index.css";

// ─── Constants ────────────────────────────────────────────────────────────────
const API = "/api/notes";

const NOTE_COLORS = [
  { hex: "#FFFBEF", name: "Parchment" },
  { hex: "#FFF0F0", name: "Rose" },
  { hex: "#F0F5F0", name: "Sage" },
  { hex: "#F0F5FF", name: "Sky" },
  { hex: "#F5F0FF", name: "Lavender" },
  { hex: "#FFFDF7", name: "Ivory" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ note, onSave, onClose }) {
  const [form, setForm] = useState({
    title: note.title,
    content: note.content,
    color: note.color,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    await onSave(note._id, form);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <p className="modal-title">Edit Note</p>

        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Note title..."
              maxLength={100}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Content</label>
            <textarea
              className="form-textarea"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your note..."
            />
          </div>

          <div className="form-field">
            <label className="form-label">Color</label>
            <div className="color-picker">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.hex}
                  className={`color-swatch ${form.color === c.hex ? "active" : ""}`}
                  style={{ background: c.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)" }}
                  onClick={() => setForm({ ...form, color: c.hex })}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || !form.title.trim() || !form.content.trim()}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Note Card ────────────────────────────────────────────────────────────────
function NoteCard({ note, onDelete, onEdit, onTogglePin }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(note._id);
  };

  return (
    <div
      className={`note-card ${note.pinned ? "pinned" : ""}`}
      style={{ "--note-color": note.color }}
    >
      <div className="note-card-header">
        <h3 className="note-title">{note.title}</h3>
        <div className="note-actions">
          <button
            className="btn btn-ghost"
            title={note.pinned ? "Unpin" : "Pin"}
            onClick={() => onTogglePin(note._id)}
            style={{ fontSize: "0.9rem", padding: "6px 8px" }}
          >
            {note.pinned ? "📌" : "📍"}
          </button>
          <button
            className="btn btn-ghost"
            title="Edit"
            onClick={() => onEdit(note)}
            style={{ fontSize: "0.85rem", padding: "6px 8px" }}
          >
            ✎
          </button>
          <button
            className="btn btn-danger"
            title="Delete"
            onClick={handleDelete}
            disabled={deleting}
            style={{ fontSize: "0.85rem", padding: "6px 8px" }}
          >
            {deleting ? "…" : "✕"}
          </button>
        </div>
      </div>

      <p className="note-content">{note.content}</p>

      <div className="note-footer">
        <span className="note-date">{formatDate(note.createdAt)}</span>
        {note.pinned && <span className="pin-badge">pinned</span>}
      </div>
    </div>
  );
}

// ─── Create Form ──────────────────────────────────────────────────────────────
function CreateForm({ onCreated }) {
  const [form, setForm] = useState({ title: "", content: "", color: NOTE_COLORS[0].hex });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setCreating(true);
    const success = await onCreated(form);
    if (success) setForm({ title: "", content: "", color: NOTE_COLORS[0].hex });
    setCreating(false);
  };

  return (
    <div className="form-card">
      <p className="form-header">New Note</p>

      <div className="form-grid">
        <div className="form-field">
          <label className="form-label">Title</label>
          <input
            className="form-input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Give your note a title…"
            maxLength={100}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <div className="form-field">
          <label className="form-label">Content</label>
          <textarea
            className="form-textarea"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Write anything you'd like to remember…"
          />
        </div>

        <div className="form-field">
          <label className="form-label">Note Color</label>
          <div className="color-picker">
            {NOTE_COLORS.map((c) => (
              <button
                key={c.hex}
                className={`color-swatch ${form.color === c.hex ? "active" : ""}`}
                style={{ background: c.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)" }}
                onClick={() => setForm({ ...form, color: c.hex })}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={creating || !form.title.trim() || !form.content.trim()}
        >
          {creating ? "Creating…" : "+ Add Note"}
        </button>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editNote, setEditNote] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Fetch notes ──────────────────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    try {
      const { data } = await axios.get(API);
      setNotes(data.data);
    } catch {
      addToast("Failed to load notes", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // ── Create ───────────────────────────────────────────────────────────────
  const handleCreate = async (form) => {
    try {
      const { data } = await axios.post(API, form);
      setNotes((prev) => [data.data, ...prev]);
      addToast("Note created!");
      return true;
    } catch {
      addToast("Failed to create note", "error");
      return false;
    }
  };

  // ── Update ───────────────────────────────────────────────────────────────
  const handleUpdate = async (id, form) => {
    try {
      const { data } = await axios.put(`${API}/${id}`, form);
      setNotes((prev) => prev.map((n) => (n._id === id ? data.data : n)));
      setEditNote(null);
      addToast("Note updated!");
    } catch {
      addToast("Failed to update note", "error");
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      addToast("Note deleted");
    } catch {
      addToast("Failed to delete note", "error");
    }
  };

  // ── Toggle pin ───────────────────────────────────────────────────────────
  const handleTogglePin = async (id) => {
    try {
      const { data } = await axios.patch(`${API}/${id}/pin`);
      setNotes((prev) =>
        prev
          .map((n) => (n._id === id ? data.data : n))
          .sort((a, b) => b.pinned - a.pinned || new Date(b.createdAt) - new Date(a.createdAt))
      );
    } catch {
      addToast("Failed to update pin", "error");
    }
  };

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <h1 className="logo">
            Note<span className="logo-dot" />
          </h1>
          <p className="tagline">Your thoughts, beautifully kept.</p>
        </div>
        <span className="note-count">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </span>
      </header>

      {/* ── Create Form ── */}
      <CreateForm onCreated={handleCreate} />

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="search-wrapper">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Notes ── */}
      {loading ? (
        <div className="loading">
          <div className="spinner" />
          LOADING NOTES…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <p className="empty-title">
            {search ? "No notes found" : "Your notebook is empty"}
          </p>
          <p className="empty-sub">
            {search ? "Try a different search term" : "Create your first note above"}
          </p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <section>
              <p className="notes-section-label">
                <span className="pin-icon">📌</span> Pinned
              </p>
              <div className="notes-grid">
                {pinned.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onDelete={handleDelete}
                    onEdit={setEditNote}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </section>
          )}

          {unpinned.length > 0 && (
            <section>
              {pinned.length > 0 && (
                <p className="notes-section-label">All Notes</p>
              )}
              <div className="notes-grid">
                {unpinned.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onDelete={handleDelete}
                    onEdit={setEditNote}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Edit Modal ── */}
      {editNote && (
        <EditModal
          note={editNote}
          onSave={handleUpdate}
          onClose={() => setEditNote(null)}
        />
      )}

      {/* ── Toasts ── */}
      <Toast toasts={toasts} />
    </div>
  );
}
