/**
 * Design Tokens System - 食物记录应用设计系统
 * 
 * 基于 design.md 规范建立的统一设计令牌系统
 * 提供颜色、间距、圆角、字体等设计元素的统一定义
 */

export const designTokens = {
  /**
   * 颜色系统
   */
  colors: {
    // 主色系 - 粉色主题
    primary: {
      main: '#F27BA9',        // 主操作按钮、链接
      light: '#f599bc',       // 浅色变体
      dark: '#e16b97',        // 深色变体（hover 状态）
      foreground: '#ffffff',  // 主色上的文字颜色
    },
    
    // 背景色系
    background: {
      primary: '#EAEAFD',     // 主背景色（浅紫色）
      secondary: '#E7F6E9',   // 辅助背景色（浅绿色）
      surface: '#ffffff',     // 卡片/表面背景
      overlay: 'rgba(0, 0, 0, 0.5)', // 遮罩层
    },
    
    // 强调色系
    accent: {
      calories: '#F6B74A',    // 热量数值专用色（橙色）
      success: '#22c55e',     // 成功状态
      warning: '#f59e0b',     // 警告状态
      error: '#ef4444',       // 错误状态
      info: '#3b82f6',        // 信息状态
    },
    
    // 标签和分类色系
    category: {
      breakfast: {
        background: '#fff7ed', // 早餐 - 橙色系
        border: '#fed7aa',
        text: '#ea580c',
      },
      lunch: {
        background: '#fefce8', // 午餐 - 黄色系
        border: '#fde047',
        text: '#ca8a04',
      },
      dinner: {
        background: '#eff6ff', // 晚餐 - 蓝色系
        border: '#93c5fd',
        text: '#2563eb',
      },
      snack: {
        background: '#f0fdf4', // 加餐 - 绿色系
        border: '#86efac',
        text: '#16a34a',
      },
    },
    
    // 中性色系
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },

  /**
   * 圆角系统 - 超圆角设计语言
   */
  borderRadius: {
    none: '0px',
    sm: '8px',             // 小圆角
    md: '12px',            // 中等圆角
    lg: '16px',            // 大圆角 - 输入框
    xl: '20px',            // 超大圆角 - 按钮
    '2xl': '24px',         // 卡片圆角
    '3xl': '32px',         // 特大圆角
    full: '9999px',        // 完全圆形
  },

  /**
   * 间距系统
   */
  spacing: {
    // 移动端友好的触摸区域
    touch: {
      min: '44px',          // 最小触摸目标
      comfortable: '48px',   // 舒适触摸目标
      large: '56px',        // 大型触摸目标
    },
    
    // 内边距系统
    padding: {
      xs: '8px',
      sm: '12px',
      md: '16px',
      lg: '20px',
      xl: '24px',
      '2xl': '32px',
    },
    
    // 外边距系统
    margin: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
    },
  },

  /**
   * 字体系统
   */
  typography: {
    fontFamily: {
      display: ['Inter', 'Noto Sans SC', 'sans-serif'],
      body: ['Inter', 'Noto Sans SC', 'sans-serif'],
      mono: ['SF Mono', 'Monaco', 'Inconsolata', 'monospace'],
    },
    
    fontSize: {
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['14px', { lineHeight: '20px' }],
      base: ['16px', { lineHeight: '24px' }],
      lg: ['18px', { lineHeight: '28px' }],
      xl: ['20px', { lineHeight: '28px' }],
      '2xl': ['24px', { lineHeight: '32px' }],
      '3xl': ['30px', { lineHeight: '36px' }],
      '4xl': ['36px', { lineHeight: '40px' }],
      '5xl': ['48px', { lineHeight: '1' }],
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    letterSpacing: {
      tight: '-0.02em',
      normal: '0em',
      wide: '0.02em',
    },
  },

  /**
   * 阴影系统
   */
  boxShadow: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    fab: '0 8px 16px 0 rgb(242 123 169 / 0.24)', // FAB 专用阴影
  },

  /**
   * 动画和过渡
   */
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // 弹性动画
    },
  },

  /**
   * 层级系统
   */
  zIndex: {
    hide: '-1',
    base: '0',
    docked: '10',
    dropdown: '1000',
    sticky: '1100',
    banner: '1200',
    overlay: '1300',
    modal: '1400',
    popover: '1500',
    skipLink: '1600',
    toast: '1700',
    tooltip: '1800',
  },
}

/**
 * 常用组合样式
 */
export const compositeStyles = {
  // 卡片样式组合
  card: {
    base: `rounded-[${designTokens.borderRadius['2xl']}] bg-white shadow-sm border border-neutral-100`,
    hover: 'hover:shadow-md transition-shadow duration-200',
    interactive: 'hover:shadow-md active:scale-[0.98] transition-all duration-200',
  },
  
  // 按钮样式组合
  button: {
    primary: `bg-[${designTokens.colors.primary.main}] text-white hover:bg-[${designTokens.colors.primary.dark}] rounded-[${designTokens.borderRadius.xl}]`,
    touch: `min-h-[${designTokens.spacing.touch.min}] px-6`,
    fab: `fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-fab`,
  },
  
  // 输入框样式组合
  input: {
    base: `rounded-[${designTokens.borderRadius.lg}] border border-neutral-300 focus:border-primary-main focus:ring-2 focus:ring-primary-main/20`,
    touch: `min-h-[${designTokens.spacing.touch.min}] px-4`,
  },
  
  // 导航样式组合
  navigation: {
    bottom: 'backdrop-blur-xl bg-white/80 border-t border-neutral-200/50',
    item: `flex-1 flex flex-col items-center py-2 min-h-[${designTokens.spacing.touch.comfortable}]`,
    activeIndicator: `w-6 h-1 bg-[${designTokens.colors.primary.main}] rounded-full`,
  },
  
  // 餐次标签样式
  mealType: {
    breakfast: `bg-[${designTokens.colors.category.breakfast.background}] border-[${designTokens.colors.category.breakfast.border}] text-[${designTokens.colors.category.breakfast.text}]`,
    lunch: `bg-[${designTokens.colors.category.lunch.background}] border-[${designTokens.colors.category.lunch.border}] text-[${designTokens.colors.category.lunch.text}]`,
    dinner: `bg-[${designTokens.colors.category.dinner.background}] border-[${designTokens.colors.category.dinner.border}] text-[${designTokens.colors.category.dinner.text}]`,
    snack: `bg-[${designTokens.colors.category.snack.background}] border-[${designTokens.colors.category.snack.border}] text-[${designTokens.colors.category.snack.text}]`,
  },
}

/**
 * 餐次配置数据
 */
export const mealTypeConfig = [
  {
    id: 'breakfast' as const,
    emoji: '🌅',
    label: '早餐',
    color: designTokens.colors.category.breakfast,
    className: compositeStyles.mealType.breakfast,
  },
  {
    id: 'lunch' as const,
    emoji: '☀️',
    label: '中餐',
    color: designTokens.colors.category.lunch,
    className: compositeStyles.mealType.lunch,
  },
  {
    id: 'dinner' as const,
    emoji: '🌙',
    label: '晚餐',
    color: designTokens.colors.category.dinner,
    className: compositeStyles.mealType.dinner,
  },
  {
    id: 'snack' as const,
    emoji: '🍎',
    label: '加餐',
    color: designTokens.colors.category.snack,
    className: compositeStyles.mealType.snack,
  },
]

/**
 * 类型定义
 */
export type MealType = typeof mealTypeConfig[number]['id']
export type ColorToken = keyof typeof designTokens.colors
export type SpacingToken = keyof typeof designTokens.spacing
export type TypographyToken = keyof typeof designTokens.typography