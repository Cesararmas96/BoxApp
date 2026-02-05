import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-[1.25rem] text-sm font-bold uppercase tracking-widest ring-offset-background transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] active:duration-100",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 hover:bg-destructive/90 hover:shadow-destructive/40 hover:-translate-y-0.5 active:translate-y-0",
                outline:
                    "border-2 border-primary/20 bg-background/50 backdrop-blur-md hover:bg-primary/5 hover:border-primary/40 hover:text-primary hover:-translate-y-0.5",
                secondary:
                    "bg-secondary/80 backdrop-blur-md text-secondary-foreground hover:bg-secondary hover:-translate-y-0.5",
                ghost: "hover:bg-primary/10 hover:text-primary hover:scale-[1.02]",
                link: "text-primary underline-offset-4 hover:underline",
                premium: "relative overflow-hidden bg-zinc-950 text-white shadow-2xl transition-all duration-500 hover:shadow-primary/30 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-tr before:from-primary/30 before:to-transparent before:opacity-0 hover:before:opacity-100 active:scale-[0.98]",
            },
            size: {
                default: "h-12 px-8 py-3",
                sm: "h-10 rounded-xl px-5 text-[11px]",
                lg: "h-16 rounded-[1.5rem] px-12 text-base",
                icon: "h-12 w-12 rounded-full",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
