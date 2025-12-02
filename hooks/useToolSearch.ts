import { useState } from "react";
import { searchTools, getTools, MiniTool } from "@/lib/api";

export function useToolSearch() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch(
    query: string,
    setTools: (tools: MiniTool[]) => void,
    refreshTools: () => Promise<void>
  ) {
    setSearchQuery(query);

    if (!query.trim()) {
      // If search is empty, refresh all tools
      await refreshTools();
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchTools(query);
      setTools(data);
    } catch (err) {
      console.error("Failed to search tools:", err);
      throw err;
    } finally {
      setIsSearching(false);
    }
  }

  return {
    searchQuery,
    isSearching,
    handleSearch,
  };
}

