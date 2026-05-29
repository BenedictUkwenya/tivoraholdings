import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary/5 text-primary [&>svg]:text-primary",
        destructive: "border-destructive/30 bg-destructive/5 text-destructive [&>svg]:text-destructive",
        info: "border-border bg-card text-foreground [&>svg]:text-muted-foreground",
        success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 [&>svg]:text-emerald-400",
        warning: "border-amber-500/30 bg-amber-500/5 text-amber-400 [&>svg]:text-amber-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return (
    <h5
      className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-sm [&_p]:leading-relaxed opacity-90", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
