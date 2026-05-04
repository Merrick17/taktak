"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-lg" />,
});

interface RichTextEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "اكتب وصف المنتج...",
}: RichTextEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(next) => onChange(next ?? "")}
        preview="edit"
        height={320}
        visibleDragbar={false}
        textareaProps={{ placeholder }}
      />
    </div>
  );
}
