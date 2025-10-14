"use client";

import { useState } from "react";
import { useTags } from "@/hooks/useTags"; // Your existing hook for allTags/search (adjust path if needed)
import { useContentTags } from "@/hooks/useContentTags"; // New hook for content-specific tags (from previous responses)
import type { Tag } from "@/hooks/useTags"; // { id: string; name: string; } (adjust path if needed)

interface TagsInputProps {
  contentId: string; // UUID for the content (required for fetch/add/remove)
}

export function TagsInput({ contentId }: TagsInputProps) {
  const { tags: allTags = [], loading: loadingTags } = useTags(); // All approved tags for search

  // Use hook for selectedTags, add/remove (fetches from content_tags, APIs for CRUD)
  const {
    selectedTags,
    addTag: apiAddTag, // Hook's addTag (POST to content_tags)
    removeTag: apiRemoveTag, // Hook's removeTag (DELETE from content_tags)
    loading: contentTagsLoading,
    error: contentTagsError,
  } = useContentTags({ contentId });

  const [tagQuery, setTagQuery] = useState(""); // Input value
  const [searchResults, setSearchResults] = useState<Tag[]>([]); // Filtered tags for dropdown

  // Handle input change (search/filter tags from allTags)
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagQuery(value);

    if (value.trim()) {
      // Client-side filter (fast; filters existing approved tags)
      const filteredTags = allTags.filter(tag =>
        tag.name.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filteredTags);

      // Optional: Server-side search (uncomment if you want API search on every keystroke)
      // const { searchTags } = useTags();
      // searchTags(value); // This would update allTags in useTags hook
    } else {
      setSearchResults([]);
    }
  };

  // Handle selecting a tag from dropdown (async add via API)
  const handleAddTag = async (tag: Tag) => {
    // Prevent adding if already selected (extra check, though API prevents duplicates)
    if (selectedTags.some(t => t.id === tag.id)) return;

    const result = await apiAddTag(tag.id); // Calls POST /api/content/[contentId]/tags
    if (result.success) {
      setTagQuery(""); // Clear input
      setSearchResults([]); // Clear dropdown
    } else {
      console.error("Failed to add tag:", result.error); // Or use toast notification (e.g., react-hot-toast)
      // Optional: alert(result.error); // For simple error handling
    }
  };

  // Handle removing a selected tag (async remove via API)
  const handleRemoveTag = async (tagId: string) => {
    const result = await apiRemoveTag(tagId); // Calls DELETE /api/content/[contentId]/tags/[tagId]
    if (!result.success) {
      console.error("Failed to remove tag:", result.error); // Or use toast
      // Optional: alert(result.error);
    }
  };

  // Prepare tag_ids for API (e.g., expose via ref or context for form submit)
  const tag_ids = selectedTags.map(tag => tag.id);

  // Loading/Error states (from hooks)
  if (contentTagsLoading || loadingTags) {
    return (
      <div style={{ padding: "12px", color: "white", fontSize: "14px" }}>
        Loading tags...
      </div>
    );
  }
  if (contentTagsError) {
    return (
      <div style={{ padding: "12px", color: "red", fontSize: "14px" }}>
        Error loading tags: {contentTagsError}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      <label style={{ fontSize: "16px", fontWeight: 500, color: "white" }}>Tags</label>

      {/* Unified tag input container (pills + input in same box) */}
      <div style={{ 
        position: "relative", 
        width: "100%", // Full width (will be constrained by parent w-[855px])
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "6px",
        background: "transparent", // Matches popup theme
        padding: "8px",
        minHeight: "44px", // Ensures consistent height even if no pills
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Pills + Input Row (flex wrap for multi-line if many pills) */}
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: "4px", 
          alignItems: "center",
          flex: 1,
        }}>
          {/* Selected tags as pills (from hook: id + name) */}
          {selectedTags.map(tag => (
            <div
              key={tag.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "4px 8px",
                borderRadius: "12px",
                background: "rgba(145, 158, 171, 0.08)",
                color: "white",
                fontSize: "12px",
                border: "", // Subtle border for definition
                maxWidth: "150px", // Prevent overly wide pills
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {tag.name}
              </span>
              <span
                style={{ 
                  marginLeft: "6px", 
                  cursor: "pointer", 
                  fontWeight: "bold",
                  flexShrink: 0,
                  padding: "0 2px",
                }}
                onClick={() => handleRemoveTag(tag.id)} // Now async API remove
                title="Remove tag" // Tooltip for accessibility
              >
                ×
              </span>
            </div>
          ))}

          {/* Input field (takes remaining space, shrinks if needed) */}
          <input
            type="text"
            value={tagQuery}
            onChange={handleTagInputChange}
            placeholder={selectedTags.length > 0 ? "" : "Search tags..."} // Dynamic placeholder
            style={{
              flex: 1,
              minWidth: "120px", // Minimum width to avoid squishing
              border: "none", // No border since container has it
              outline: "none",
              background: "transparent",
              color: "white",
              fontSize: "14px",
              padding: "4px 0", // Less padding since container has it
              margin: "0 4px 4px 0", // Space for wrapping
            }}
            onKeyDown={(e) => {
              // Allow Enter to add tag (if exact match in searchResults)
              if (e.key === "Enter" && tagQuery.trim()) {
                const matchedTag = searchResults.find(t => t.name.toLowerCase() === tagQuery.toLowerCase().trim());
                if (matchedTag) {
                  handleAddTag(matchedTag); // Async add
                }
                e.preventDefault();
              }
            }}
          />
        </div>

        {/* Dropdown (positioned below the entire container) */}
        {tagQuery && searchResults.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "rgba(0,0,0,0.8)",
              color: "white",
              maxHeight: "150px",
              overflowY: "auto",
              borderRadius: "6px",
              zIndex: 1000,
              border: "1px solid rgba(255,255,255,0.1)", // Match container border
              marginTop: "4px", // Small gap from container
            }}
          >
            {searchResults.map(tag => (
              <div
                key={tag.id}
                style={{ 
                  padding: "8px 12px", 
                  cursor: "pointer",
                  borderBottom: "1px solid rgba(255,255,255,0.05)", // Subtle separator
                }}
                onClick={() => handleAddTag(tag)} // Async add via API
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} // Hover effect
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                {tag.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optional: Debug output for tag_ids (remove in production) */}
      {/* <pre style={{ fontSize: "12px", color: "gray" }}>
        {JSON.stringify({ tag_ids, selectedTags: selectedTags.map(t => t.name) }, null, 2)}
      </pre> */}
    </div>
  );
}