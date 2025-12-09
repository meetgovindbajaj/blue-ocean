"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  RemoveFormatting,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton = ({
  onClick,
  active,
  disabled,
  title,
  children,
}: ToolbarButtonProps) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    disabled={disabled}
    title={title}
    className={cn(
      "h-8 w-8 p-0 hover:bg-accent",
      active && "bg-accent text-accent-foreground"
    )}
  >
    {children}
  </Button>
);

const ToolbarDivider = () => (
  <div className="w-px h-6 bg-border mx-1" />
);

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter description...",
  className,
  minHeight = "200px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const [, forceUpdate] = useState(0);

  // Set initial content
  useEffect(() => {
    if (editorRef.current && isInitialMount.current) {
      editorRef.current.innerHTML = value || "";
      isInitialMount.current = false;
    }
  }, [value]);

  // Update content when value changes externally
  useEffect(() => {
    if (editorRef.current && !isInitialMount.current) {
      // Only update if the content is different (to preserve cursor position)
      if (editorRef.current.innerHTML !== value) {
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        editorRef.current.innerHTML = value || "";
        // Try to restore cursor position
        if (range && editorRef.current.contains(range.commonAncestorContainer)) {
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, cmdValue?: string) => {
    // Ensure the editor has focus before executing command
    editorRef.current?.focus();
    document.execCommand(command, false, cmdValue);
    handleInput();
    // Force re-render to update active states
    forceUpdate((n) => n + 1);
  }, [handleInput]);

  const formatBlock = useCallback((tag: string) => {
    // Ensure the editor has focus before executing command
    editorRef.current?.focus();
    // formatBlock requires HTML tags like <h1>, <p>, etc.
    document.execCommand("formatBlock", false, `<${tag}>`);
    handleInput();
    forceUpdate((n) => n + 1);
  }, [handleInput]);

  const insertLink = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";
    const url = prompt("Enter URL:", "https://");
    if (url && url !== "https://") {
      if (selectedText) {
        execCommand("createLink", url);
      } else {
        // If no text selected, insert a link with the URL as text
        const link = `<a href="${url}" target="_blank">${url}</a>`;
        execCommand("insertHTML", link);
      }
    }
  }, [execCommand]);

  const isFormatActive = useCallback((command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }, []);

  const removeFormatting = useCallback(() => {
    execCommand("removeFormat");
    // Also remove block formatting
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      if (container.nodeType === Node.TEXT_NODE && container.parentElement) {
        const parent = container.parentElement;
        if (["H1", "H2", "H3", "BLOCKQUOTE"].includes(parent.tagName)) {
          formatBlock("p");
        }
      }
    }
  }, [execCommand, formatBlock]);

  // Update active states on selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      forceUpdate((n) => n + 1);
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => execCommand("undo")}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand("redo")}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => formatBlock("h1")}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => formatBlock("h2")}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => formatBlock("h3")}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => execCommand("bold")}
          active={isFormatActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand("italic")}
          active={isFormatActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand("underline")}
          active={isFormatActive("underline")}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => execCommand("insertUnorderedList")}
          active={isFormatActive("insertUnorderedList")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand("insertOrderedList")}
          active={isFormatActive("insertOrderedList")}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => execCommand("justifyLeft")}
          active={isFormatActive("justifyLeft")}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand("justifyCenter")}
          active={isFormatActive("justifyCenter")}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand("justifyRight")}
          active={isFormatActive("justifyRight")}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Block Elements */}
        <ToolbarButton
          onClick={() => formatBlock("blockquote")}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={insertLink}
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Remove Formatting */}
        <ToolbarButton
          onClick={removeFormatting}
          title="Remove Formatting"
        >
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className={cn(
          "p-4 outline-none bg-background text-foreground",
          // Headings
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3",
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:my-3",
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2",
          // Paragraphs
          "[&_p]:my-2",
          // Lists
          "[&_ul]:my-2 [&_ul]:pl-6 [&_ul]:list-disc",
          "[&_ol]:my-2 [&_ol]:pl-6 [&_ol]:list-decimal",
          "[&_li]:my-1",
          // Blockquote
          "[&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          // Links
          "[&_a]:text-primary [&_a]:underline",
          // Text formatting
          "[&_b]:font-bold [&_strong]:font-bold",
          "[&_i]:italic [&_em]:italic",
          "[&_u]:underline",
          // Placeholder
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&:empty]:before:pointer-events-none"
        )}
        style={{ minHeight }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}
