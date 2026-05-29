import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border border-[rgba(212,168,83,0.15)] bg-[rgba(13,20,35,0.8)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[rgba(212,168,83,0.5)] focus:ring-2 focus:ring-[rgba(212,168,83,0.1)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none",
      className
    )}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export { Textarea }
