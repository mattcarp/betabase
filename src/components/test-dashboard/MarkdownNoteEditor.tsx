"use client";

import React, { useState, useEffect } from "react";
import { useAnnotations } from "../../contexts/AnnotationContext";
import { NoteAnnotation } from "../../types/annotations";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import {
  X,
  Save,
  Eye,
  Edit,
  Bold,
  Italic,
  List,
  Link,
  Code,
  Heading1,
  Heading2,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface MarkdownNoteEditorProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MarkdownNoteEditor: React.FC<MarkdownNoteEditorProps> = ({
  noteId,
  isOpen,
  onClose,
}) => {
  const { annotations, updateAnnotation } = useAnnotations();
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    const annotation = annotations.find((ann) => ann.id === noteId);
    if (annotation && annotation.data.type === "note") {
      const noteData = annotation.data as NoteAnnotation;
      setContent(noteData.markdownContent || noteData.text || "");
    }
  }, [noteId, annotations]);

  const handleSave = () => {
    const annotation = annotations.find((ann) => ann.id === noteId);
    if (!annotation || annotation.data.type !== "note") return;

    updateAnnotation(noteId, {
      data: {
        ...annotation.data,
        text: content.split("\n")[0] || "Note", // First line as preview
        markdownContent: content,
      } as NoteAnnotation,
    });

    onClose();
  };

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.querySelector("textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) + before + selectedText + after + content.substring(end);

    setContent(newText);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering (in production, use a library like react-markdown)
    let html = text;

    // Headers
    html = html.replace(
      /^### (.*$)/gim,
      "<h3 class='mac-title text-lg font-semibold mt-4 mb-2'>$1</h3>"
    );
    html = html.replace(
      /^## (.*$)/gim,
      "<h2 class='mac-heading text-xl font-semibold mt-4 mb-2'>$1</h2>"
    );
    html = html.replace(
      /^# (.*$)/gim,
      "<h1 class='mac-heading text-2xl font-bold mt-4 mb-2'>$1</h1>"
    );

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, "<strong class='font-bold'>$1</strong>");

    // Italic
    html = html.replace(/\*(.*?)\*/gim, "<em class='italic'>$1</em>");

    // Code
    html = html.replace(
      /`(.*?)`/gim,
      "<code class='bg-muted px-2 py-0.5 rounded text-sm font-mono'>$1</code>"
    );

    // Links
    html = html.replace(
      /\[(.*?)\]\((.*?)\)/gim,
      "<a href='$2' class='text-primary underline' target='_blank'>$1</a>"
    );

    // Lists
    html = html.replace(/^\* (.*$)/gim, "<li class='ml-4'>$1</li>");
    html = html.replace(/^- (.*$)/gim, "<li class='ml-4'>$1</li>");

    // Line breaks
    html = html.replace(/\n/gim, "<br>");

    return html;
  };

  if (!isOpen) return null;

  return (
    <div cclassName="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
      <Card cclassName="mac-card max-w-4xl w-full max-h-[80vh] flex flex-col">
        <CardHeader cclassName="mac-card flex-shrink-0">
          <div cclassName="flex items-center justify-between">
            <CardTitle cclassName="flex items-center gap-2">
              <Edit cclassName="h-5 w-5" />
              Detailed Note Editor
              <Badge variant="secondary" cclassName="text-xs">
                Markdown Supported
              </Badge>
            </CardTitle>
            <Button
              cclassName="mac-button mac-button-outline"
              variant="ghost"
              cclassName="mac-button mac-button-outline"
              size="icon"
              onClick={onClose}
            >
              <X cclassName="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent cclassName="flex-1 overflow-hidden flex flex-col p-6">
          {/* Toolbar */}
          <div cclassName="flex items-center gap-2 mb-4 pb-4 border-b flex-shrink-0">
            <Button
              cclassName="mac-button mac-button-outline"
              variant="ghost"
              cclassName="mac-button mac-button-outline"
              size="sm"
              onClick={() => insertMarkdown("# ", "")}
              title="Heading 1"
            >
              <Heading1 cclassName="h-4 w-4" />
            </Button>
            <Button
              cclassName="mac-button mac-button-outline"
              variant="ghost"
              cclassName="mac-button mac-button-outline"
              size="sm"
              onClick={() => insertMarkdown("## ", "")}
              title="Heading 2"
            >
              <Heading2 cclassName="h-4 w-4" />
            </Button>
            <div cclassName="w-px h-6 bg-border mx-2" />
            <Button
              cclassName="mac-button mac-button-outline"
              variant="ghost"
              cclassName="mac-button mac-button-outline"
              size="sm"
              onClick={() => insertMarkdown("**", "**")}
              title="Bold"
            >
              <Bold cclassName="h-4 w-4" />
            </Button>
            <Button
              cclassName="mac-button mac-button-outline"
              variant="ghost"
              cclassName="mac-button mac-button-outline"
              size="sm"
              onClick={() => insertMarkdown("*", "*")}
              title="Italic"
            >
              <Italic cclassName="h-4 w-4" />
            </Button>
            <Button
              cclassName="mac-button mac-button-outline"
              variant="ghost"
              cclassName="mac-button mac-button-outline"
              size="sm"
              onClick={() => insertMarkdown("`", "`")}
              title="Code"
            >
              <Code cclassName="h-4 w-4" />
            </Button>
            <div cclassName="w-px h-6 bg-border mx-2" />
            <Button
              cclassName="mac-button mac-button-outline"
              variant="ghost"
              cclassName="mac-button mac-button-outline"
              size="sm"
              onClick={() => insertMarkdown("- ", "")}
              title="List"
            >
              <List cclassName="h-4 w-4" />
            </Button>
            <Button
              cclassName="mac-button mac-button-outline"
              variant="ghost"
              cclassName="mac-button mac-button-outline"
              size="sm"
              onClick={() => insertMarkdown("[", "](url)")}
              title="Link"
            >
              <Link cclassName="h-4 w-4" />
            </Button>
          </div>

          {/* Editor/Preview Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
            cclassName="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList cclassName="flex-shrink-0">
              <TabsTrigger value="edit" cclassName="gap-2">
                <Edit cclassName="h-3 w-3" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" cclassName="gap-2">
                <Eye cclassName="h-3 w-3" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" cclassName="flex-1 overflow-hidden mt-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                cclassName="w-full h-full min-h-[400px] font-mono text-sm resize-none"
                placeholder="Write your note here... Markdown is supported!

Examples:
# Heading 1
## Heading 2
**bold text**
*italic text*
`code`
- list item
[link text](url)"
              />
            </TabsContent>

            <TabsContent value="preview" cclassName="flex-1 overflow-auto mt-4">
              <div cclassName="prose prose-sm dark:prose-invert max-w-none">
                {content ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(content),
                    }}
                  />
                ) : (
                  <p cclassName="mac-body text-muted-foreground italic">
                    No content to preview. Switch to Edit tab to add content.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div cclassName="flex items-center justify-end gap-2 mt-4 pt-4 border-t flex-shrink-0">
            <Button
              cclassName="mac-button mac-button-outline"
              variant="outline"
              cclassName="mac-button mac-button-outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              cclassName="gap-2 mac-button mac-button-primary"
            >
              <Save cclassName="h-4 w-4" />
              Save Note
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
