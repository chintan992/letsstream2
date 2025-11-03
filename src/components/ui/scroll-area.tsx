import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    scrollBarVariant?: 'default' | 'accent' | 'custom'
  }
>(({ className, children, scrollBarVariant, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden group", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar variant={scrollBarVariant} />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & {
    variant?: 'default' | 'accent' | 'custom'
    thumbClassName?: string
  }
>(({ className, orientation = "vertical", variant = 'default', thumbClassName, ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none",
      orientation === "vertical" &&
        "h-full w-1.5 group-hover:opacity-100 opacity-60 transition-opacity duration-300 ease-in-out border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-1.5 flex-col group-hover:opacity-100 opacity-60 transition-opacity duration-300 ease-in-out border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className={cn(
      "relative flex-1 rounded-full transition-all duration-300 ease-in-out",
      variant === 'default' && "custom-scrollbar-thumb-default",
      variant === 'accent' && "custom-scrollbar-thumb-accent",
      variant === 'custom' && thumbClassName
    )} />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
