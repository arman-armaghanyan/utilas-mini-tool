"use client";

import { DescriptionBlock } from "@/lib/api";

type DescriptionBlocksEditorProps = {
  description: DescriptionBlock[];
  onChange: (description: DescriptionBlock[]) => void;
};

export default function DescriptionBlocksEditor({
  description,
  onChange,
}: DescriptionBlocksEditorProps) {
  const handleAddBlock = () => {
    onChange([
      ...description,
      { image: "", text: "", orientation: "left" as const },
    ]);
  };

  const handleRemoveBlock = (index: number) => {
    const newDescription = [...description];
    newDescription.splice(index, 1);
    onChange(newDescription);
  };

  const handleUpdateBlock = (
    index: number,
    field: keyof DescriptionBlock,
    value: string
  ) => {
    const newDescription = [...description];
    newDescription[index] = {
      ...newDescription[index],
      [field]: value,
    };
    onChange(newDescription);
  };

  return (
    <div className="flex flex-col gap-4 md:col-span-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">
          Description Blocks
        </label>
        <button
          type="button"
          onClick={handleAddBlock}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
        >
          + Add Block
        </button>
      </div>

      {description.length > 0 ? (
        <div className="flex flex-col gap-4">
          {description.map((block, index) => (
            <div
              key={index}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-600">
                  Block {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveBlock(index)}
                  className="rounded-md p-1 text-red-600 transition hover:bg-red-50"
                  aria-label="Remove block"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700">
                  Image URL
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                    value={block.image}
                    onChange={(e) =>
                      handleUpdateBlock(index, "image", e.target.value)
                    }
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700">
                  Orientation
                  <select
                    className="rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                    value={block.orientation}
                    onChange={(e) =>
                      handleUpdateBlock(
                        index,
                        "orientation",
                        e.target.value
                      )
                    }
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </label>
              </div>

              <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-zinc-700">
                Text
                <textarea
                  placeholder="Description text for this block"
                  className="h-24 rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                  value={block.text}
                  onChange={(e) =>
                    handleUpdateBlock(index, "text", e.target.value)
                  }
                />
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
          No description blocks added yet. Click "Add Block" to add one.
        </div>
      )}
    </div>
  );
}

