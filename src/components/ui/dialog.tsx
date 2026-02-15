import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Drawer as VaulDrawer } from "vaul"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/useMediaQuery"

/* ─────────────────────────────────────────────
   Responsive Dialog / Drawer
   - Desktop (≥768px): centered Radix modal
   - Mobile/Tablet (<768px): bottom-sheet Drawer (vaul)
   ───────────────────────────────────────────── */

// ─── Desktop Dialog (Radix) ───

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className
        )}
        {...props}
    />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border/50 bg-card p-6 shadow-apple-xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl",
                className
            )}
            {...props}
        >
            {children}
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 opacity-50 ring-offset-background transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-1.5 text-center sm:text-left",
            className
        )}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            className
        )}
        {...props}
    />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

// ─── Mobile Drawer (vaul) ───

const DrawerRoot = VaulDrawer.Root
const DrawerTrigger = VaulDrawer.Trigger
const DrawerPortal = VaulDrawer.Portal
const DrawerClose = VaulDrawer.Close

const DrawerOverlay = React.forwardRef<
    React.ElementRef<typeof VaulDrawer.Overlay>,
    React.ComponentPropsWithoutRef<typeof VaulDrawer.Overlay>
>(({ className, ...props }, ref) => (
    <VaulDrawer.Overlay
        ref={ref}
        className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-sm", className)}
        {...props}
    />
))
DrawerOverlay.displayName = "DrawerOverlay"

const DrawerContent = React.forwardRef<
    React.ElementRef<typeof VaulDrawer.Content>,
    React.ComponentPropsWithoutRef<typeof VaulDrawer.Content>
>(({ className, children, ...props }, ref) => (
    <DrawerPortal>
        <DrawerOverlay />
        <VaulDrawer.Content
            ref={ref}
            className={cn(
                "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[96dvh] flex-col rounded-t-2xl border-t border-border/50 bg-card shadow-apple-xl",
                className
            )}
            {...props}
        >
            {/* Apple-style drag handle */}
            <div className="apple-sheet-handle" />
            <div className="flex-1 overflow-y-auto px-6 pb-8">
                {children}
            </div>
        </VaulDrawer.Content>
    </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
        {...props}
    />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("mt-auto flex flex-col gap-2 p-4", className)}
        {...props}
    />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
    React.ElementRef<typeof VaulDrawer.Title>,
    React.ComponentPropsWithoutRef<typeof VaulDrawer.Title>
>(({ className, ...props }, ref) => (
    <VaulDrawer.Title
        ref={ref}
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...props}
    />
))
DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = React.forwardRef<
    React.ElementRef<typeof VaulDrawer.Description>,
    React.ComponentPropsWithoutRef<typeof VaulDrawer.Description>
>(({ className, ...props }, ref) => (
    <VaulDrawer.Description
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
DrawerDescription.displayName = "DrawerDescription"

// ─── Responsive Dialog/Drawer Wrapper ───
// Automatically picks Drawer on mobile, Dialog on desktop.
// API mirrors Dialog so consumers don't need to change anything.

interface ResponsiveDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({ children, ...props }) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <DrawerRoot shouldScaleBackground {...props}>{children}</DrawerRoot>;
    }
    return <Dialog {...props}>{children}</Dialog>;
}

const ResponsiveDialogTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children, ...props }) => {
    const isMobile = useIsMobile();
    if (isMobile) return <DrawerTrigger {...props}>{children}</DrawerTrigger>;
    return <DialogTrigger {...props}>{children}</DialogTrigger>;
}

const ResponsiveDialogClose: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children, ...props }) => {
    const isMobile = useIsMobile();
    if (isMobile) return <DrawerClose {...props}>{children}</DrawerClose>;
    return <DialogClose {...props}>{children}</DialogClose>;
}

const ResponsiveDialogContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { className?: string }
>(({ children, className, ...props }, ref) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <DrawerContent ref={ref} className={className} {...props as any}>
                {children}
            </DrawerContent>
        );
    }
    return (
        <DialogContent ref={ref} className={className} {...props as any}>
            {children}
        </DialogContent>
    );
});
ResponsiveDialogContent.displayName = "ResponsiveDialogContent";

const ResponsiveDialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
    const isMobile = useIsMobile();
    if (isMobile) return <DrawerHeader className={className} {...props} />;
    return <DialogHeader className={className} {...props} />;
}

const ResponsiveDialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
    const isMobile = useIsMobile();
    if (isMobile) return <DrawerFooter className={className} {...props} />;
    return <DialogFooter className={className} {...props} />;
}

const ResponsiveDialogTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
    const isMobile = useIsMobile();
    if (isMobile) return <DrawerTitle ref={ref} className={className} {...props as any} />;
    return <DialogTitle ref={ref} className={className} {...props as any} />;
});
ResponsiveDialogTitle.displayName = "ResponsiveDialogTitle";

const ResponsiveDialogDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
    const isMobile = useIsMobile();
    if (isMobile) return <DrawerDescription ref={ref} className={className} {...props as any} />;
    return <DialogDescription ref={ref} className={className} {...props as any} />;
});
ResponsiveDialogDescription.displayName = "ResponsiveDialogDescription";

export {
    // Desktop Dialog (raw)
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogClose,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    // Mobile Drawer (raw)
    DrawerRoot,
    DrawerPortal,
    DrawerOverlay,
    DrawerClose,
    DrawerTrigger,
    DrawerContent,
    DrawerHeader,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
    // Responsive (auto-switch)
    ResponsiveDialog,
    ResponsiveDialogTrigger,
    ResponsiveDialogClose,
    ResponsiveDialogContent,
    ResponsiveDialogHeader,
    ResponsiveDialogFooter,
    ResponsiveDialogTitle,
    ResponsiveDialogDescription,
}
