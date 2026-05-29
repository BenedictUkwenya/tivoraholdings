import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[rgba(212,168,83,0.15)] bg-[rgba(13,20,35,0.8)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[rgba(212,168,83,0.5)] focus:ring-2 focus:ring-[rgba(212,168,83,0.1)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
