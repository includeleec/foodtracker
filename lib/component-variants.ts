/**
 * Component Variants System - 基础组件变体定义
 * 
 * 基于设计令牌系统的组件变体规范
 * 使用 class-variance-authority (cva) 来管理组件样式变体
 */

import { type VariantProps, cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * 按钮组件变体
 */
export const buttonVariants = cva(
  // 基础样式 - 移动端友好的触摸目标
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "font-medium transition-all duration-200 animate-spring",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "active:scale-[0.98] select-none"
  ],
  {
    variants: {
      variant: {
        // 主按钮 - 粉色主题
        primary: [
          "bg-primary text-primary-foreground shadow-sm",
          "hover:bg-primary-dark focus-visible:ring-primary/50",
          "border border-transparent"
        ],
        // 次要按钮
        secondary: [
          "bg-surface text-foreground shadow-sm border",
          "hover:bg-gray-50 focus-visible:ring-gray-500/50"
        ],
        // 轮廓按钮
        outline: [
          "border border-primary text-primary bg-transparent",
          "hover:bg-primary hover:text-primary-foreground",
          "focus-visible:ring-primary/50"
        ],
        // 幽灵按钮
        ghost: [
          "text-foreground hover:bg-gray-100 focus-visible:ring-gray-500/50"
        ],
        // 危险按钮
        destructive: [
          "bg-accent-error text-white shadow-sm",
          "hover:bg-red-600 focus-visible:ring-red-500/50"
        ],
        // 浮动操作按钮 (FAB)
        fab: [
          "fixed bottom-6 right-6 rounded-full shadow-fab z-50",
          "bg-primary text-primary-foreground",
          "hover:bg-primary-dark hover:shadow-lg",
          "focus-visible:ring-primary/50"
        ]
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-input",
        default: "touch-target px-6 text-base rounded-button",
        lg: "touch-comfortable px-8 text-lg rounded-button",
        icon: "h-10 w-10 rounded-button",
        fab: "h-14 w-14 text-xl"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

/**
 * 卡片组件变体
 */
export const cardVariants = cva(
  // 基础样式 - 超圆角设计
  [
    "rounded-card bg-surface shadow-sm border border-gray-100",
    "transition-all duration-200"
  ],
  {
    variants: {
      variant: {
        default: "",
        interactive: [
          "cursor-pointer hover:shadow-md active:scale-[0.99]",
          "hover:border-gray-200"
        ],
        elevated: "shadow-md border-gray-200"
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8"
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default"
    }
  }
)

export type CardVariants = VariantProps<typeof cardVariants>

/**
 * 输入框组件变体
 */
export const inputVariants = cva(
  [
    "flex w-full bg-surface border transition-colors duration-200",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "placeholder:text-gray-400",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
    "disabled:cursor-not-allowed disabled:opacity-50"
  ],
  {
    variants: {
      variant: {
        default: [
          "border-gray-300 rounded-input",
          "focus-visible:border-primary focus-visible:ring-primary/20"
        ],
        error: [
          "border-accent-error rounded-input",
          "focus-visible:border-accent-error focus-visible:ring-accent-error/20"
        ]
      },
      size: {
        sm: "h-9 px-3 text-sm",
        default: "touch-target px-4 text-base",
        lg: "touch-comfortable px-4 text-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export type InputVariants = VariantProps<typeof inputVariants>

/**
 * 餐次标签组件变体
 */
export const mealTypeVariants = cva(
  [
    "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium",
    "border rounded-button transition-colors duration-200"
  ],
  {
    variants: {
      type: {
        breakfast: "bg-breakfast-bg border-breakfast-border text-breakfast-text",
        lunch: "bg-lunch-bg border-lunch-border text-lunch-text", 
        dinner: "bg-dinner-bg border-dinner-border text-dinner-text",
        snack: "bg-snack-bg border-snack-border text-snack-text"
      },
      interactive: {
        true: "cursor-pointer hover:opacity-80 active:scale-95",
        false: ""
      }
    },
    defaultVariants: {
      type: "breakfast",
      interactive: false
    }
  }
)

export type MealTypeVariants = VariantProps<typeof mealTypeVariants>

/**
 * 底部导航项变体
 */
export const bottomNavItemVariants = cva(
  [
    "flex flex-col items-center justify-center gap-1 px-2 py-2",
    "touch-comfortable transition-colors duration-200",
    "text-xs font-medium"
  ],
  {
    variants: {
      active: {
        true: "text-primary",
        false: "text-gray-500 hover:text-gray-700"
      }
    },
    defaultVariants: {
      active: false
    }
  }
)

export type BottomNavItemVariants = VariantProps<typeof bottomNavItemVariants>

/**
 * 数值显示组件变体（热量等）
 */
export const numberDisplayVariants = cva(
  [
    "font-semibold tabular-nums transition-colors duration-200"
  ],
  {
    variants: {
      type: {
        calories: "text-accent-calories",
        default: "text-foreground",
        success: "text-accent-success",
        warning: "text-accent-warning", 
        error: "text-accent-error"
      },
      size: {
        sm: "text-sm",
        default: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl"
      }
    },
    defaultVariants: {
      type: "default",
      size: "default"
    }
  }
)

export type NumberDisplayVariants = VariantProps<typeof numberDisplayVariants>

/**
 * 加载状态组件变体
 */
export const loadingVariants = cva(
  [
    "animate-spin rounded-full border-2 border-gray-300"
  ],
  {
    variants: {
      variant: {
        default: "border-t-primary",
        white: "border-t-white",
        small: "border-t-gray-600"
      },
      size: {
        sm: "h-4 w-4",
        default: "h-6 w-6", 
        lg: "h-8 w-8",
        xl: "h-12 w-12"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export type LoadingVariants = VariantProps<typeof loadingVariants>

/**
 * 工具函数：合并类名
 */
export const mergeVariants = (...classes: (string | undefined)[]) => {
  return cn(classes)
}

/**
 * 工具函数：根据条件应用样式
 */
export const conditionalStyle = (
  condition: boolean,
  trueStyle: string,
  falseStyle: string = ""
) => {
  return condition ? trueStyle : falseStyle
}

/**
 * 餐次类型映射
 */
export const mealTypeMap = {
  breakfast: { emoji: "🌅", label: "早餐" },
  lunch: { emoji: "☀️", label: "中餐" },
  dinner: { emoji: "🌙", label: "晚餐" },
  snack: { emoji: "🍎", label: "加餐" }
} as const

export type MealType = keyof typeof mealTypeMap