import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function QuillEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  readOnly = false,
}: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    // Initialize Quill
    const quill = new Quill(editorRef.current, {
      theme: "snow",
      placeholder,
      readOnly,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link"],
          ["clean"],
        ],
      },
    });

    quillRef.current = quill;

    // Handle changes
    quill.on("text-change", () => {
      if (isUpdatingRef.current) return;
      const html = quill.root.innerHTML;
      onChange(html === "<p><br></p>" ? "" : html);
    });

    // Set initial content
    if (value) {
      isUpdatingRef.current = true;
      quill.root.innerHTML = value;
      isUpdatingRef.current = false;
    }

    return () => {
      quill.off("text-change");
    };
  }, []);

  // Update content when value changes externally
  useEffect(() => {
    if (!quillRef.current) return;

    const currentHtml = quillRef.current.root.innerHTML;
    const normalizedCurrent = currentHtml === "<p><br></p>" ? "" : currentHtml;
    const normalizedValue = value || "";

    // Only update if values are different and we're not currently in a change event
    if (normalizedCurrent !== normalizedValue && !isUpdatingRef.current) {
      isUpdatingRef.current = true;

      // Save cursor position
      const selection = quillRef.current.getSelection();

      // Update content - use proper format
      quillRef.current.root.innerHTML = normalizedValue || "<p><br></p>";

      // Restore cursor position if it existed
      if (selection) {
        try {
          quillRef.current.setSelection(selection);
        } catch (e) {
          // Selection restoration failed, place cursor at end
          const length = quillRef.current.getLength();
          quillRef.current.setSelection(length - 1);
        }
      }

      isUpdatingRef.current = false;
    }
  }, [value]);

  // Update readOnly state
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  return <div ref={editorRef} />;
}
