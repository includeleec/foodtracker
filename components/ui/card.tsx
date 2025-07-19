import * as React from "react"
import { cardVariants, type CardVariants } from "@/lib/component-variants"
import { cn } from "@/lib/utils"

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    CardVariants {
  asChild?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600 leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-6 pb-6", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center px-6 pb-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

/**
 * 食物记录卡片 - 专门用于食物记录展示的卡片组件
 */
export interface FoodRecordCardProps extends CardProps {
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories?: number
  imageUrl?: string
  foodName?: string
  weight?: number
  onEdit?: () => void
  onDelete?: () => void
}

const FoodRecordCard = React.forwardRef<HTMLDivElement, FoodRecordCardProps>(
  ({ 
    className, 
    mealType = 'breakfast',
    calories,
    imageUrl,
    foodName,
    weight,
    onEdit,
    onDelete,
    children,
    ...props 
  }, ref) => (
    <Card
      ref={ref}
      variant="interactive"
      className={cn("overflow-hidden", className)}
      {...props}
    >
      {children}
    </Card>
  )
)
FoodRecordCard.displayName = "FoodRecordCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  FoodRecordCard 
}