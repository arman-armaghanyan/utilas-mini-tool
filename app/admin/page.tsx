"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MiniTool,
  MiniToolPrev,
  MiniToolPrevPayload,
  createTool,
  createToolPreview,
  deleteTool,
  deleteToolPreview,
  getTools,
  getTool,
  updateTool,
  updateToolPreview,
  uploadReactApp,
} from "@/lib/api";
import ToolFormModal from "@/Components/ToolFormModal";
import MiniToolListItem from "@/Components/MiniToolListItem";
import SearchInput from "@/Components/SearchInput";
import {useToolSearch} from "@/hooks/useToolSearch";
import PreviewToolFormModal from "@/Components/PreviewToolFormModal";
import {ApiError, MiniToolPayloadDto} from "@/lib/api";

const defaultForm: MiniToolPayloadDto = {
  id: "",
  title: "",
  summary: "",
  description: [],
  thumbnail: "",
  iframeSlug: "",
  iframeHtml: "",
  appType: "html",
};

const defaultPreviewForm: MiniToolPrevPayload = {
  id: "",
  title: "",
  summary: "",
  thumbnail: "",
  toolId: "",
};

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tools, setTools] = useState<MiniToolPrev[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<MiniToolPayloadDto>(defaultForm);
  const [editing, setEditing] = useState<MiniTool | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [reactAppFile, setReactAppFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { searchQuery, isSearching, handleSearch } = useToolSearch();

  const [previewFormData, setPreviewFormData] =
    useState<MiniToolPrevPayload>(defaultPreviewForm);
  const [previewEditing, setPreviewEditing] = useState<MiniToolPrev | null>(null);
  const [previewSaving, setPreviewSaving] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewSuccessMessage, setPreviewSuccessMessage] = useState<string | null>(
    null
  );
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      refreshTools();
    }
  }, [status]);

  const headerTitle = useMemo(
      () => (editing ? "Update mini tool" : "Create a new mini tool"),
      [editing]
  );

  const previewHeaderTitle = useMemo(
    () => (previewEditing ? "Update preview tool" : "Create a new preview tool"),
    [previewEditing]
  );

  if (status === "loading") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12">
        <div className="text-sm text-zinc-500">Loading...</div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  async function refreshTools() {
    setLoading(true);
    setError(null);
    try {
      const data = await getTools();
      setTools(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load tools.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onSearch(query: string) {
    setError(null);
    try {
      await handleSearch(query, setTools, refreshTools);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to search tools.";
      setError(message);
    }
  }

  function resetForm() {
    setFormData(defaultForm);
    setEditing(null);
    setReactAppFile(null);
    setIsModalOpen(false);
    setError(null);
    setSuccessMessage(null);
  }

  function resetPreviewForm() {
    setPreviewFormData(defaultPreviewForm);
    setPreviewEditing(null);
    setPreviewSaving(false);
    setPreviewError(null);
    setPreviewSuccessMessage(null);
    setIsPreviewModalOpen(false);
  }

  function openAddModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function openAddPreviewModal() {
    resetPreviewForm();
    setIsPreviewModalOpen(true);
  }

  async function onEdit(toolPrev: MiniToolPrev) {
    setSaving(true);
    setError(null);
    try {
      const tool = await getTool(toolPrev.toolId);
      setEditing(tool);
      setFormData({
        id: tool.id,
        title: tool.title,
        summary: tool.summary,
        description: Array.isArray(tool.description) ? tool.description : [],
        thumbnail: tool.thumbnail,
        iframeSlug: tool.iframeSlug,
        iframeHtml: tool.iframeHtml || "",
        appType: tool.appType || "html",
      });
      setReactAppFile(null);
      setIsModalOpen(true);
      setSuccessMessage(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load tool details.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(tool: MiniToolPrev) {
    const confirmed = window.confirm(
      `Delete "${tool.title}"? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteTool(tool.toolId);
      setSuccessMessage(`Deleted ${tool.title}.`);
      await refreshTools();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete tool.";
      setError(message);
    }
  }

  function onEditPreview(toolPrev: MiniToolPrev) {
    setPreviewError(null);
    setPreviewSuccessMessage(null);
    setPreviewEditing(toolPrev);
    setPreviewFormData({
      id: toolPrev.id,
      title: toolPrev.title,
      summary: toolPrev.summary,
      thumbnail: toolPrev.thumbnail,
      toolId: toolPrev.toolId,
    });
    setIsPreviewModalOpen(true);
  }

  async function onDeletePreview(toolPrev: MiniToolPrev) {
    const confirmed = window.confirm(
      `Delete preview "${toolPrev.title}" (preview id: ${toolPrev.id})? This will NOT delete the real tool.`
    );
    if (!confirmed) return;

    setPreviewSaving(true);
    setPreviewError(null);
    try {
      await deleteToolPreview(toolPrev.id);
      setPreviewSuccessMessage(`Deleted preview ${toolPrev.title}.`);
      await refreshTools();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete preview.";
      setPreviewError(message);
    } finally {
      setPreviewSaving(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    if (editing && formData.id !== editing.id) {
      setError("Tool ID cannot be changed after creation.");
      setSaving(false);
      return;
    }

    // Validate description blocks
    if (!Array.isArray(formData.description) || formData.description.length === 0) {
      setError("Please add at least one description block.");
      setSaving(false);
      return;
    }

    // Validate each description block
    for (let i = 0; i < formData.description.length; i++) {
      const block = formData.description[i];
      if (!block.image || !block.text || !block.orientation) {
        setError(`Description block ${i + 1} is incomplete. Please fill in all fields.`);
        setSaving(false);
        return;
      }
    }

    try {
      if (editing) {
        const { id: preservedId, ...rest } = formData;
        // Remove iframeHtml for React apps
        if (rest.appType === "react") {
          delete rest.iframeHtml;
        }
        const updated = await updateTool(preservedId, rest);
        
        // If React app file is provided, upload it
        if (reactAppFile) {
          await uploadReactApp(preservedId, reactAppFile);
        }
        
        setSuccessMessage(`Updated ${updated.title}.`);
      } else {
        // For new tools, create first
        const payload = { ...formData };
        // Remove iframeHtml for React apps, or ensure it's present for HTML apps
        if (payload.appType === "react") {
          delete payload.iframeHtml;
        }
        
        // Validate React app has file
        if (payload.appType === "react" && !reactAppFile) {
          setError("Please upload a React app zip file.");
          setSaving(false);
          return;
        }
        
        const created = await createTool(payload);
        

        if (reactAppFile) {
          await uploadReactApp(created.id, reactAppFile);
          setSuccessMessage(`Created ${created.title} and uploaded React app.`);
        } else {
          setSuccessMessage(`Created ${created.title}.`);
        }
      }
      resetForm();
      setIsModalOpen(false);
      await refreshTools();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Unable to save tool.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function onSubmitPreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreviewSaving(true);
    setPreviewError(null);
    setPreviewSuccessMessage(null);

    if (previewEditing && previewFormData.id !== previewEditing.id) {
      setPreviewError("Preview ID cannot be changed after creation.");
      setPreviewSaving(false);
      return;
    }

    try {
      if (previewEditing) {
        const { id, ...rest } = previewFormData;
        const updated = await updateToolPreview(id, rest);
        setPreviewSuccessMessage(`Updated preview ${updated.title}.`);
      } else {
        const created = await createToolPreview(previewFormData);
        setPreviewSuccessMessage(`Created preview ${created.title}.`);
      }

      resetPreviewForm();
      setIsPreviewModalOpen(false);
      await refreshTools();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Unable to save preview.";
      setPreviewError(message);
    } finally {
      setPreviewSaving(false);
    }
  }

  function bindField<K extends keyof MiniToolPayloadDto>(field: K) {
    return {
      value: formData[field],
      onChange: (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) =>
        setFormData((prev) => ({
          ...prev,
          [field]: event.target.value,
        })),
    };
  }

  function bindPreviewField<K extends keyof MiniToolPrevPayload>(field: K) {
    return {
      value: previewFormData[field],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setPreviewFormData((prev) => ({
          ...prev,
          [field]: event.target.value,
        })),
    };
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Admin Panel</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Manage your catalog of mini tools. Create, update, or remove entries
            and edit the HTML rendered in iframes.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={openAddModal}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + Add Tool
          </button>
          <button
            type="button"
            onClick={openAddPreviewModal}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            + Add Preview Tool
          </button>
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to library
          </Link>
        </div>
      </div>

      <ToolFormModal
        isOpen={isModalOpen}
        formData={formData}
        editing={editing}
        error={error}
        successMessage={successMessage}
        saving={saving}
        reactAppFile={reactAppFile}
        headerTitle={headerTitle}
        onClose={resetForm}
        onSubmit={onSubmit}
        bindField={bindField}
        setFormData={setFormData}
        setReactAppFile={setReactAppFile}
      />

      <PreviewToolFormModal
        isOpen={isPreviewModalOpen}
        formData={previewFormData}
        editing={previewEditing}
        error={previewError}
        successMessage={previewSuccessMessage}
        saving={previewSaving}
        headerTitle={previewHeaderTitle}
        onClose={resetPreviewForm}
        onSubmit={onSubmitPreview}
        bindField={bindPreviewField}
        setFormData={setPreviewFormData}
      />

      <section className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Existing tools</h2>
          <div className="flex items-center gap-4">
            <SearchInput
              value={searchQuery}
              onChange={onSearch}
              inline={true}
            />
            <span className="text-sm text-zinc-500">
              {tools.length} item{tools.length === 1 ? "" : "s"}
              {searchQuery && ` found`}
            </span>
          </div>
        </header>

        {loading || isSearching ? (
          <div className="rounded-md border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">
            {isSearching ? "Searching..." : "Loading tools..."}
          </div>
        ) : tools.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
            {searchQuery
              ? `No tools found matching "${searchQuery}".`
              : "No tools in the catalog yet."}
          </div>
        ) : (
          <div className="grid gap-4">
            {tools.map((tool) => (
              <MiniToolListItem
                key={tool.id}
                tool={tool}
                onEditTool={onEdit}
                onDeleteTool={onDelete}
                onEditPreview={onEditPreview}
                onDeletePreview={onDeletePreview}
                saving={saving || previewSaving}
                editing={editing}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

