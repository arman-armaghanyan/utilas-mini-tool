"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { MiniToolPrev, MiniToolPrevPayload, searchTools } from "@/lib/api";
import SearchInput from "@/Components/SearchInput";

type PreviewToolFormModalProps = {
  bindField: <K extends keyof MiniToolPrevPayload>(
    field: K
  ) => {
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    value: MiniToolPrevPayload[K];
  };
  editing: MiniToolPrev | null;
  error: string | null;
  formData: MiniToolPrevPayload;
  headerTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  saving: boolean;
  setFormData: React.Dispatch<React.SetStateAction<MiniToolPrevPayload>>;
  successMessage: string | null;
};

export default function PreviewToolFormModal({
  isOpen,
  formData,
  editing,
  error,
  successMessage,
  saving,
  headerTitle,
  onClose,
  onSubmit,
  bindField,
  setFormData,
}: PreviewToolFormModalProps) {
  const [toolSearchQuery, setToolSearchQuery] = useState("");
  const [toolSearchResults, setToolSearchResults] = useState<MiniToolPrev[]>([]);
  const [toolSearchError, setToolSearchError] = useState<string | null>(null);
  const [isSearchingTools, setIsSearchingTools] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Reset search state when opening/closing
  useEffect(() => {
    if (!isOpen) return;
    setToolSearchQuery("");
    setToolSearchResults([]);
    setToolSearchError(null);
    setIsSearchingTools(false);
  }, [isOpen]);

  // Debounced tool search
  useEffect(() => {
    if (!isOpen) return;
    const q = toolSearchQuery.trim();
    if (!q) {
      setToolSearchResults([]);
      setToolSearchError(null);
      return;
    }

    let cancelled = false;
    const handle = setTimeout(async () => {
      setIsSearchingTools(true);
      setToolSearchError(null);
      try {
        const results = await searchTools(q);
        if (cancelled) return;
        setToolSearchResults(results);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to search tools.";
        setToolSearchError(msg);
      } finally {
        if (!cancelled) setIsSearchingTools(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [isOpen, toolSearchQuery]);

  const uniqueToolChoices = useMemo(() => {
    const byToolId = new Map<string, MiniToolPrev>();
    for (const r of toolSearchResults) {
      if (!byToolId.has(r.toolId)) byToolId.set(r.toolId, r);
    }
    return Array.from(byToolId.values());
  }, [toolSearchResults]);

  function onPickTool(target: MiniToolPrev) {
    setFormData((prev) => {
      const next: MiniToolPrevPayload = { ...prev, toolId: target.toolId };
      // Helpful defaults: only auto-fill if empty, keeping custom previews flexible.
      if (!next.title) next.title = target.title;
      if (!next.summary) next.summary = target.summary;
      if (!next.thumbnail) next.thumbnail = target.thumbnail;
      return next;
    });
    setToolSearchQuery("");
    setToolSearchResults([]);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-xl">
        <section className="flex flex-col gap-4 p-6">
          <header className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">{headerTitle}</h2>
              <p className="text-sm text-zinc-500">
                Create a preview card that redirects to an existing mini tool.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Close modal"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </header>

          {(error || toolSearchError) && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error || toolSearchError}
            </div>
          )}

          {successMessage && (
            <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <div className="grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-medium text-zinc-800">
              Link to existing tool
            </div>
            <SearchInput
              value={toolSearchQuery}
              onChange={setToolSearchQuery}
              placeholder="Search existing tools by title..."
              inline={true}
            />
            {isSearchingTools ? (
              <div className="text-xs text-zinc-500">Searching...</div>
            ) : uniqueToolChoices.length > 0 ? (
              <div className="grid gap-2">
                {uniqueToolChoices.slice(0, 8).map((t) => (
                  <button
                    key={t.toolId}
                    type="button"
                    onClick={() => onPickTool(t)}
                    className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-left text-sm transition hover:bg-zinc-50"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-900">{t.title}</span>
                      <span className="text-xs text-zinc-500">Tool ID: {t.toolId}</span>
                    </div>
                    <span className="text-xs font-medium text-blue-600">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            ) : toolSearchQuery.trim() ? (
              <div className="text-xs text-zinc-500">No results.</div>
            ) : (
              <div className="text-xs text-zinc-500">
                Pick a tool to link via <code className="text-xs">toolId</code>.
              </div>
            )}
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
              Preview ID
              <input
                type="text"
                placeholder="e.g. landing-color-helper"
                className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
                {...bindField("id")}
                disabled={Boolean(editing)}
              />
              <span className="text-xs font-normal text-zinc-500">
                Unique id for this preview card.
              </span>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
              Redirect Tool ID
              <input
                type="text"
                placeholder="e.g. color-helper"
                className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
                {...bindField("toolId")}
              />
              <span className="text-xs font-normal text-zinc-500">
                Clicking this preview redirects to <code>/tools/{`{toolId}`}</code>.
              </span>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 md:col-span-2">
              Title
              <input
                type="text"
                placeholder="Preview title"
                className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
                {...bindField("title")}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 md:col-span-2">
              Summary
              <input
                type="text"
                placeholder="Short preview summary"
                className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
                {...bindField("summary")}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 md:col-span-2">
              Thumbnail URL
              <input
                type="url"
                placeholder="https://"
                className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
                {...bindField("thumbnail")}
              />
            </label>

            <div className="flex items-center gap-3 md:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                disabled={saving}
              >
                {saving ? "Saving..." : editing ? "Update preview" : "Create preview"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}


