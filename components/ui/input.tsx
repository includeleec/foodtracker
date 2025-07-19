import * as React from "react"
import { inputVariants, type InputVariants } from "@/lib/component-variants"
import { cn } from "@/lib/utils"

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    InputVariants {
  error?: string
  label?: string
  hint?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, size, error, label, hint, ...props }, ref) => {
    const inputId = React.useId()
    const errorId = React.useId()
    const hintId = React.useId()
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        
        <input
          id={inputId}
          type={type}
          className={cn(
            inputVariants({ 
              variant: error ? "error" : variant, 
              size 
            }), 
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={cn(
            error && errorId,
            hint && hintId
          )}
          {...props}
        />
        
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
        
        {error && (
          <p id={errorId} className="text-xs text-accent-error flex items-center gap-1">
            <span>⚠️</span>
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

/**
 * 数字输入框 - 专门用于数字输入（如体重、热量等）
 */
export interface NumberInputProps extends Omit<InputProps, 'type'> {
  min?: number
  max?: number
  step?: number
  unit?: string
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, unit, label, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        
        <div className="relative">
          <Input
            ref={ref}
            type="number"
            className={cn("pr-12", className)}
            {...props}
          />
          {unit && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {unit}
            </div>
          )}
        </div>
      </div>
    )
  }
)
NumberInput.displayName = "NumberInput"

/**
 * 搜索输入框
 */
export interface SearchInputProps extends Omit<InputProps, 'type'> {
  onSearch?: (value: string) => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, placeholder = "搜索...", ...props }, ref) => {
    const [value, setValue] = React.useState("")
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSearch?.(value)
    }
    
    return (
      <form onSubmit={handleSubmit} className="relative">
        <Input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className={cn("pl-10", className)}
          {...props}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </div>
      </form>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { Input, NumberInput, SearchInput }