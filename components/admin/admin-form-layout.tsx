"use client";

import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminFormLayoutProps {
  title: string;
  backHref: string;
  backLabel?: string;
  onSave?: () => void;
  onCancel?: () => void;
  saving?: boolean;
  saveLabel?: string;
  children: React.ReactNode;
}

export function AdminFormLayout({
  title,
  backHref,
  backLabel = "العودة",
  onSave,
  onCancel,
  saving = false,
  saveLabel = "حفظ",
  children,
}: AdminFormLayoutProps) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="sticky top-14 sm:top-16 z-10 bg-background/95 backdrop-blur border-b border-border px-6 sm:px-10 py-4 sm:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronRight className="size-4" />
            {backLabel}
          </Link>
          <span className="text-muted-foreground hidden sm:inline">/</span>
          <h1 className="text-base sm:text-lg font-semibold truncate">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={saving}
            >
              إلغاء
            </Button>
          )}
          {!onCancel && (
            <Link href={backHref}>
              <Button variant="outline" size="sm" disabled={saving}>
                إلغاء
              </Button>
            </Link>
          )}
          {onSave && (
            <Button size="sm" onClick={onSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              {saveLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 sm:p-10 min-w-0">
        <div className="max-w-4xl mx-auto space-y-8">{children}</div>
      </div>
    </div>
  );
}
