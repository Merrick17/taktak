"use client"

import { cn } from "@/lib/utils"

interface SimpleOption {
  name: string
  values: string[]
  outOfStockValues?: string[]
}

interface VariantSelectorProps {
  options: SimpleOption[]
  selected: Record<string, string>
  onChange: (optionName: string, value: string) => void
}

export function VariantSelector({ options, selected, onChange }: VariantSelectorProps) {
  if (!options?.length) return null

  return (
    <div className="flex flex-col gap-4">
      {options.map((option) => (
        <div key={option.name}>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium">{option.name}</span>
            {selected[option.name] && (
              <span className="text-sm text-muted-foreground">
                : {selected[option.name]}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {option.values.map((val) => {
              const isOos = option.outOfStockValues?.includes(val) ?? false
              const isSelected = selected[option.name] === val
              return (
                <button
                  key={val}
                  onClick={() => !isOos && onChange(option.name, val)}
                  disabled={isOos}
                  aria-disabled={isOos}
                  title={isOos ? "غير متوفر" : undefined}
                  className={cn(
                    "relative min-w-[2.5rem] rounded-md border px-3 py-1.5 text-sm transition-all",
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : isOos
                        ? "border-border text-muted-foreground opacity-40 cursor-not-allowed line-through"
                        : "border-border hover:border-foreground/60"
                  )}
                >
                  {val}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
