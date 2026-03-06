import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { buildTenantUrl, clearDevTenantSlug } from '@/utils/tenant';
import { supabase } from '@/lib/supabaseClient';

interface BoxOption {
    id: string;
    name: string;
    slug: string;
}

export const RootControlBar: React.FC = () => {
    const { isRoot, currentBox } = useAuth();
    const [boxes, setBoxes] = useState<BoxOption[]>([]);

    useEffect(() => {
        if (!isRoot) return;
        supabase
            .from('boxes' as any)
            .select('id, name, slug')
            .order('name')
            .then(({ data }) => {
                if (data) setBoxes(data as unknown as BoxOption[]);
            });
    }, [isRoot]);

    if (!isRoot) return null;

    const handleGoToAdmin = () => {
        clearDevTenantSlug();
        window.location.href = '/admin';
    };

    const handleBoxChange = (slug: string) => {
        const url = buildTenantUrl(slug);
        // buildTenantUrl returns '/?box=slug' in dev — redirect to /dashboard to avoid
        // React Router Route "/" redirecting back to /admin and losing the ?box= param.
        const target = url.startsWith('http')
            ? url
            : `${window.location.origin}/dashboard?box=${slug}`;
        window.location.href = target;
    };

    const isSuspended = (currentBox as any)?.subscription_status === 'suspended';

    return (
        <div className="flex items-center justify-between px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/30 shrink-0">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleGoToAdmin}
                className="h-7 gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 hover:text-amber-800 dark:hover:text-amber-300"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Panel Admin
            </Button>

            <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                {currentBox ? (
                    <>
                        <span>
                            Inspeccionando: <strong>{currentBox.name}</strong>
                        </span>
                        {isSuspended && (
                            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-semibold uppercase tracking-wide">
                                Suspendido
                            </span>
                        )}
                    </>
                ) : (
                    <span className="text-muted-foreground italic">Sin box seleccionado</span>
                )}
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 hover:text-amber-800 dark:hover:text-amber-300"
                    >
                        cambiar <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 max-h-60 overflow-y-auto">
                    {boxes.length === 0 ? (
                        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                            Cargando boxes...
                        </DropdownMenuItem>
                    ) : (
                        boxes.map((box) => (
                            <DropdownMenuItem
                                key={box.id}
                                onClick={() => handleBoxChange(box.slug)}
                                className="cursor-pointer text-sm"
                            >
                                {box.name}
                            </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
