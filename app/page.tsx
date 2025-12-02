"use client";

import Image from "next/image";
import Link from "next/link";
import {getTools, MiniTool} from "@/lib/api";
import {useEffect, useState} from "react";
import ErrorHandelComponent from "@/Components/ErrorHandelComponent";
import EmptyToolsComponent from "@/Components/EmptyToolsComponent";
import MiniToolPreviewComponent from "@/Components/MiniToolPreviewComponent";
import SearchInput from "@/Components/SearchInput";
import {useToolSearch} from "@/hooks/useToolSearch";

export const dynamic = "force-dynamic";

export default  function HomePage() {
  const [tools, setTools] = useState<MiniTool[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { searchQuery, isSearching, handleSearch } = useToolSearch();

  useEffect(() => {
    refreshTools();
  }, []);

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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="flex flex-col gap-4 text-center sm:text-left">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Mini Tools Library
        </h1>
        <p className="text-lg text-zinc-600">
          Explore bite-sized utilities to embed inside your product, or dive
          into the admin area to curate your own collection.
        </p>
        <div className="mt-4">
          <SearchInput
            value={searchQuery}
            onChange={onSearch}
            showResultCount={true}
            resultCount={tools.length}
            resultLabel="result"
          />
        </div>
      </section>

      {
        error ? (
            ErrorHandelComponent({error})
      ) : loading || isSearching ? (
        <div className="rounded-md border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 shadow-sm">
          {isSearching ? "Searching..." : "Loading tools..."}
        </div>
      ) : tools.length === 0 ? (
        searchQuery ? (
          <div className="rounded-md border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
            No tools found matching "{searchQuery}".
          </div>
        ) : (
          <EmptyToolsComponent />
        )
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
              MiniToolPreviewComponent({tool})
          ))}
        </div>
      )}
    </main>
  );
}
