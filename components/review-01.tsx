"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Quote, Star } from "lucide-react";

interface ReviewOneProps {
  quote: string
  author: string
  handle: string
  rating?: number
  initials?: string
  accentColor?: string
}

export function ReviewOne({
  quote,
  author,
  handle,
  rating = 5,
  initials,
  accentColor = "bg-primary/10 text-primary",
}: ReviewOneProps) {
  const avatarInitials = initials ?? author.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <Card className="w-full border-border/60 hover:border-border hover:shadow-sm transition-all duration-200">
      <CardContent className="p-6 space-y-4">
        <Quote className="w-7 h-7 text-primary/30" />

        {rating > 0 && (
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3.5 ${i < rating ? "fill-primary text-primary" : "fill-muted text-muted-foreground/30"}`}
              />
            ))}
          </div>
        )}

        <p className="text-sm leading-relaxed text-foreground/80">
          {quote}
        </p>

        <div className="flex items-center gap-3 pt-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${accentColor}`}>
            {avatarInitials}
          </div>
          <div>
            <h4 className="font-semibold text-sm">{author}</h4>
            <p className="text-muted-foreground text-xs">{handle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
