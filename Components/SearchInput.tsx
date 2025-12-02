"use client";

type SearchInputProps = {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showResultCount?: boolean;
  resultCount?: number;
  resultLabel?: string;
  inline?: boolean;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search tools...",
  className = "",
  inputClassName = "",
  showResultCount = false,
  resultCount = 0,
  resultLabel = "result",
  inline = false,
}: SearchInputProps) {
  const containerClass = inline
    ? `relative ${className}`
    : `flex flex-col gap-2 sm:flex-row sm:items-center ${className}`;
  
  const inputWrapperClass = inline
    ? `relative ${inputClassName || "w-64"}`
    : `relative w-full sm:w-96`;

  return (
    <div className={containerClass}>
      <div className={inputWrapperClass}>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      {showResultCount && value && !inline && (
        <span className="text-sm text-zinc-500">
          {resultCount} {resultLabel}{resultCount === 1 ? "" : "s"} found
        </span>
      )}
    </div>
  );
}

