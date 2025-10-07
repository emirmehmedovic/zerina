"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import { renderMarkdown } from "@/lib/markdown";

async function fetchCsrf(): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/csrf`, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return '';
    const data = await res.json().catch(() => ({}));
    return String(data?.csrfToken || '');
  } catch {
    return '';
  }
}

export default function NewVendorBlogPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [tags, setTags] = useState<string>("");
  const [status, setStatus] = useState<'DRAFT'|'PUBLISHED'>("DRAFT");
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tagList = useMemo(() => tags.split(',').map(t=>t.trim()).filter(Boolean).slice(0,10), [tags]);
  const previewHtml = useMemo(() => renderMarkdown(content), [content]);

  function insertAtCursor(snippet: string) {
    const ta = editorRef.current;
    if (!ta) {
      setContent((prev) => prev + snippet);
      return;
    }
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    const next = before + snippet + after;
    setContent(next);
    // Reset caret to after inserted snippet
    requestAnimationFrame(() => {
      ta.focus();
      const pos = before.length + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  async function onUploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const csrf = await fetchCsrf();
      const res = await fetch(`${API_URL}/api/v1/uploads`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrf },
        body: form,
      });
      if (!res.ok) throw new Error('upload_failed');
      const data = await res.json();
      setCoverPath(String(data?.path));
    } catch (e:any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onInsertImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const csrf = await fetchCsrf();
      const res = await fetch(`${API_URL}/api/v1/uploads`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrf },
        body: form,
      });
      if (!res.ok) throw new Error('upload_failed');
      const data = await res.json();
      const path = String(data?.path);
      const alt = file.name.replace(/\.[^.]+$/, '');
      insertAtCursor(`\n\n![${alt}](${path})\n`);
    } catch (e:any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDropUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const csrf = await fetchCsrf();
      const res = await fetch(`${API_URL}/api/v1/uploads`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrf },
        body: form,
      });
      if (!res.ok) throw new Error('upload_failed');
      const data = await res.json();
      const path = String(data?.path);
      const alt = file.name.replace(/\.[^.]+$/, '');
      insertAtCursor(`\n\n![${alt}](${path})\n`);
    } catch (e:any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const csrf = await fetchCsrf();
      const res = await fetch(`${API_URL}/api/v1/blog`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf,
        },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim() || null,
          content,
          coverImageStorageKey: coverPath ? coverPath.split('/').pop() : null,
          status,
          tags: tagList,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(body?.error || `save_failed_${res.status}`);
      }
      const data = await res.json();
      router.push(`/dashboard/blog/${data.id}/edit`);
      router.refresh();
    } catch (e:any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">New Blog Post</h1>
            <p className="text-zinc-400 mt-1">Write your story in Markdown, add images easily, and publish.</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={status} onChange={(e)=>setStatus(e.target.value as any)} className="px-2 py-2 rounded-lg border border-white/10 bg-white/5 text-zinc-200">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
            <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-200 hover:bg-blue-500/25 transition-colors">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>

        {error && <div className="mb-3 text-rose-400">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor card */}
          <div className="lg:col-span-2 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 overflow-hidden">
            {/* Title & excerpt */}
            <div className="p-4 md:p-5 space-y-3">
              <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500" />
              <textarea value={excerpt} onChange={(e)=>setExcerpt(e.target.value)} placeholder="Short excerpt (optional)" className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500 min-h-[70px]" />
            </div>
            {/* Toolbar */}
            <div className="px-4 md:px-5 pb-3 flex flex-wrap items-center gap-2 border-t border-white/5">
              <button onClick={()=>insertAtCursor("\n\n## Heading\n")} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 text-sm">H2</button>
              <button onClick={()=>insertAtCursor("**bold**")} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 text-sm">Bold</button>
              <button onClick={()=>insertAtCursor("*italic*")} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 text-sm">Italic</button>
              <button onClick={()=>{
                const txt = prompt('Link text:') || 'link';
                const url = prompt('URL (https://...) :') || 'https://';
                insertAtCursor(`[${txt}](${url})`);
              }} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 text-sm">Link</button>
              <label className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 text-sm cursor-pointer">
                Image
                <input type="file" accept="image/*" onChange={onInsertImage} disabled={uploading} className="hidden" />
              </label>
              {uploading && <span className="text-xs text-zinc-400">Uploading…</span>}
            </div>
            {/* Textarea with drag-n-drop */}
            <div
              onDragOver={(e)=>{ e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e)=>{ e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void handleDropUpload(f); }}
              className="p-4 md:p-5 border-t border-white/10"
            >
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e)=>setContent(e.target.value)}
                placeholder="Write your story in Markdown… (drag & drop an image to upload)"
                className="w-full px-3 py-3 rounded-lg border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500 min-h-[360px] font-mono"
              />
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            {/* Tags & cover */}
            <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-4 md:p-5 space-y-3">
              <input value={tags} onChange={(e)=>setTags(e.target.value)} placeholder="Tags (comma-separated)" className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500" />
              <div className="text-xs text-zinc-400">{tagList.length} tags</div>
              <div
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer overflow-hidden"
                onClick={() => coverInputRef.current?.click()}
                onDragOver={(e)=>{ e.preventDefault(); e.stopPropagation(); }}
                onDrop={async (e)=>{ e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) {
                  // Reuse upload cover pipeline
                  const ev = { target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  await onUploadCover(ev);
                }}}
              >
                {coverPath ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${API_URL}${coverPath}`} alt="Cover" className="w-full h-52 object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-between bg-black/30 text-zinc-100 text-xs">
                      <span>Cover selected</span>
                      <button type="button" onClick={(e)=>{ e.stopPropagation(); setCoverPath(null); }} className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/10">Remove</button>
                    </div>
                  </div>
                ) : (
                  <div className="h-52 flex flex-col items-center justify-center text-zinc-400">
                    <div className="text-sm">Click or drag & drop to add a cover image</div>
                    <div className="text-[11px] mt-1 opacity-75">Recommended: 1600×900 or larger</div>
                  </div>
                )}
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={onUploadCover} disabled={uploading} className="hidden" />
            </div>

            {/* Live preview */}
            <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-4 md:p-5">
              <div className="text-xs uppercase tracking-wider text-zinc-400 mb-2">Preview</div>
              <article className="prose prose-invert prose-sm sm:prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </article>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
