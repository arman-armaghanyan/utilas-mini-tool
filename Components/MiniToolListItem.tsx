"use client";

import Link from "next/link";
import { MiniToolPrev, MiniTool } from "@/lib/api";

type MiniToolListItemProps = {
  tool: MiniToolPrev;
  onEditTool: (tool: MiniToolPrev) => void;
  onDeleteTool: (tool: MiniToolPrev) => void;
  onEditPreview: (tool: MiniToolPrev) => void;
  onDeletePreview: (tool: MiniToolPrev) => void;
  saving: boolean;
  editing: MiniTool | null;
};

export default function MiniToolListItem({
  tool,
  onEditTool,
  onDeleteTool,
  onEditPreview,
  onDeletePreview,
  saving,
  editing,
}: MiniToolListItemProps) {

  const isPreviewOnly = tool.id !== tool.toolId;

  function handleEdit() {
    if (isPreviewOnly) return onEditPreview(tool);
    return onEditTool(tool);
  }

  function handleDelete() {
    if (isPreviewOnly) return onDeletePreview(tool);
    return onDeleteTool(tool);
  }
  return (
    <article
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
    >
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-zinc-900">{tool.title}</h3>
          {isPreviewOnly && (
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Preview
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-zinc-600">{tool.summary}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-zinc-400">
          <span>Preview ID: {tool.id}</span>
          <span>Tool ID: {tool.toolId}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-md border border-blue-500 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
          onClick={handleEdit}
          disabled={saving && !isPreviewOnly && editing?.id === tool.toolId}
        >
          Edit
        </button>
        <button
          type="button"
          className="rounded-md border border-red-500 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          onClick={handleDelete}
          disabled={saving}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

