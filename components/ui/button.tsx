import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { buttonVariants, type ButtonVariants } from "@/lib/component-variants"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

/**
 * 浮动操作按钮 (FAB) 组件
 */
export interface FABProps extends Omit<ButtonProps, 'variant' | 'size'> {
  icon?: React.ReactNode
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ className, children, icon, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="fab"
        size="fab" 
        className={className}
        {...props}
      >
        {icon || children}
      </Button>
    )
  }
)
FAB.displayName = "FAB"

export { Button, FAB, buttonVariants }