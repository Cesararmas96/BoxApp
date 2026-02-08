import React, { useState } from 'react';
import { useLanguage } from '@/hooks';
import {
    Plus,
    GripVertical,
    Trash2,
    Zap as ZapIcon,
    Timer,
    Target,
    Activity,
    Flame as FlameIcon,
    Dumbbell,
    Search,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface BlockItem {
    id: string;
    movementName: string;
    reps?: string;
    weight?: string;
    notes?: string;
    [key: string]: any;
}

export interface SessionBlock {
    id: string;
    type: 'warmup' | 'strength' | 'conditioning' | 'wod' | 'accessory' | 'cooldown';
    title: string;
    items: BlockItem[];
    sets?: string;
    duration?: string;
    [key: string]: any;
}

export interface LessonBlock {
    time: string;
    activity: string;
    description: string;
    [key: string]: any;
}

interface WODDesignerProps {
    sessionBlocks: SessionBlock[];
    setSessionBlocks: (blocks: SessionBlock[]) => void;
    movements: any[];
}

export const WODDesigner: React.FC<WODDesignerProps> = ({
    sessionBlocks,
    setSessionBlocks,
    movements
}) => {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearchBlockId, setActiveSearchBlockId] = useState<string | null>(null);
    const [searchPage, setSearchPage] = useState(1);
    const searchItemsPerPage = 5;

    const BLOCK_TEMPLATES: Record<string, { title: string; icon: any; color: string }> = {
        warmup: { title: t('wods.block_warmup'), icon: <FlameIcon className="h-4 w-4" />, color: 'bg-orange-500/10 text-orange-500' },
        strength: { title: t('wods.block_strength'), icon: <Dumbbell className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-500' },
        conditioning: { title: t('wods.block_conditioning'), icon: <ZapIcon className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-500' },
        wod: { title: t('wods.block_wod'), icon: <Timer className="h-4 w-4" />, color: 'bg-red-500/10 text-red-500' },
        accessory: { title: t('wods.block_accessory'), icon: <Target className="h-4 w-4" />, color: 'bg-green-500/10 text-green-500' },
        cooldown: { title: t('wods.block_cooldown'), icon: <Activity className="h-4 w-4" />, color: 'bg-slate-500/10 text-slate-500' }
    };

    const addBlock = (type: SessionBlock['type']) => {
        const newBlock: SessionBlock = {
            id: crypto.randomUUID(),
            type,
            title: BLOCK_TEMPLATES[type].title,
            items: []
        };
        setSessionBlocks([...sessionBlocks, newBlock]);
    };

    const removeBlock = (id: string) => {
        setSessionBlocks(sessionBlocks.filter(b => b.id !== id));
    };

    const updateBlock = (id: string, updates: Partial<SessionBlock>) => {
        setSessionBlocks(sessionBlocks.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const addMovementToBlock = (blockId: string, movement: any) => {
        setSessionBlocks(sessionBlocks.map(b => {
            if (b.id === blockId) {
                return {
                    ...b,
                    items: [...b.items, {
                        id: crypto.randomUUID(),
                        movementName: movement.name,
                        reps: '',
                        weight: '',
                        notes: ''
                    }]
                };
            }
            return b;
        }));
    };

    const removeMovementFromBlock = (blockId: string, itemId: string) => {
        setSessionBlocks(sessionBlocks.map(b => {
            if (b.id === blockId) {
                return { ...b, items: b.items.filter(i => i.id !== itemId) };
            }
            return b;
        }));
    };

    const updateMovementInBlock = (blockId: string, itemId: string, updates: Partial<BlockItem>) => {
        setSessionBlocks(sessionBlocks.map(b => {
            if (b.id === blockId) {
                return {
                    ...b,
                    items: b.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
                };
            }
            return b;
        }));
    };

    const onDragEnd = (result: any) => {
        if (!result.destination) return;
        const items = Array.from(sessionBlocks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setSessionBlocks(items);
    };

    const allFilteredMovements = movements.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMovements = allFilteredMovements.slice(
        (searchPage - 1) * searchItemsPerPage,
        searchPage * searchItemsPerPage
    );

    const totalSearchPages = Math.ceil(allFilteredMovements.length / searchItemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
                {Object.entries(BLOCK_TEMPLATES).map(([type, config]) => (
                    <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => addBlock(type as any)}
                    >
                        {config.icon}
                        {config.title}
                    </Button>
                ))}
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="blocks">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {sessionBlocks.map((block, index) => (
                                <Draggable key={block.id} draggableId={block.id} index={index}>
                                    {(provided) => (
                                        <Card
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="border-l-4 overflow-visible"
                                            style={{
                                                borderLeftColor: `var(--${block.type}-color)`,
                                                ...provided.draggableProps.style
                                            }}
                                        >
                                            <div className="flex items-center gap-3 p-3 bg-muted/20 border-b">
                                                <div {...provided.dragHandleProps}>
                                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <Badge className={BLOCK_TEMPLATES[block.type].color}>
                                                    {BLOCK_TEMPLATES[block.type].icon}
                                                    <span className="ml-1 uppercase text-[10px] font-bold tracking-tighter">
                                                        {block.type}
                                                    </span>
                                                </Badge>
                                                <Input
                                                    value={block.title}
                                                    onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                                                    className="h-8 bg-transparent border-none font-bold text-sm focus-visible:ring-0 px-0"
                                                />
                                                <div className="flex items-center gap-2 ml-auto">
                                                    <div className="flex items-center gap-1 bg-background/50 rounded px-2 py-1 border text-[10px] font-semibold">
                                                        <span className="text-muted-foreground uppercase">Sets:</span>
                                                        <input
                                                            type="text"
                                                            value={block.sets || ''}
                                                            onChange={(e) => updateBlock(block.id, { sets: e.target.value })}
                                                            placeholder="--"
                                                            className="w-8 bg-transparent border-none text-center focus:outline-none"
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => removeBlock(block.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <CardContent className="p-4 space-y-4">
                                                <div className="space-y-2">
                                                    {block.items.map((item) => (
                                                        <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/10 rounded-lg group">
                                                            <div className="flex-1 font-medium text-sm">{item.movementName}</div>
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    placeholder="Reps/Time"
                                                                    value={item.reps}
                                                                    onChange={(e) => updateMovementInBlock(block.id, item.id, { reps: e.target.value })}
                                                                    className="h-7 w-20 text-[10px] bg-background"
                                                                />
                                                                <Input
                                                                    placeholder="Weight"
                                                                    value={item.weight}
                                                                    onChange={(e) => updateMovementInBlock(block.id, item.id, { weight: e.target.value })}
                                                                    className="h-7 w-16 text-[10px] bg-background"
                                                                />
                                                                <Input
                                                                    placeholder="Notes"
                                                                    value={item.notes}
                                                                    onChange={(e) => updateMovementInBlock(block.id, item.id, { notes: e.target.value })}
                                                                    className="h-7 flex-1 text-[10px] bg-background min-w-[100px]"
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => removeMovementFromBlock(block.id, item.id)}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                        <Search className="h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                    <Input
                                                        placeholder={t('wods.search_movements', { defaultValue: 'SEARCH MOVEMENTS...' })}
                                                        className="pl-8 h-10 text-xs bg-primary/5 border-primary/20 focus:border-primary/50 focus:ring-primary/10 transition-all font-bold uppercase tracking-widest"
                                                        value={activeSearchBlockId === block.id ? searchQuery : ''}
                                                        onFocus={() => setActiveSearchBlockId(block.id)}
                                                        onChange={(e) => {
                                                            setSearchQuery(e.target.value);
                                                            setActiveSearchBlockId(block.id);
                                                        }}
                                                    />
                                                    {activeSearchBlockId === block.id && searchQuery && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-primary/20 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                            <div className="max-h-[300px] overflow-y-auto">
                                                                {filteredMovements.map((m) => (
                                                                    <button
                                                                        key={m.id}
                                                                        className="w-full text-left px-3 py-3 text-xs hover:bg-primary/10 flex items-center justify-between group transition-colors border-b last:border-0"
                                                                        onClick={() => {
                                                                            addMovementToBlock(block.id, m);
                                                                            setSearchQuery('');
                                                                            setActiveSearchBlockId(null);
                                                                            setSearchPage(1);
                                                                        }}
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold uppercase italic tracking-tighter text-sm">{m.name}</span>
                                                                            {m.category && <span className="text-[9px] text-muted-foreground uppercase font-black">{m.category}</span>}
                                                                        </div>
                                                                        <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </button>
                                                                ))}
                                                                {allFilteredMovements.length === 0 && (
                                                                    <div className="px-3 py-6 text-center">
                                                                        <p className="text-[10px] text-muted-foreground italic uppercase tracking-widest font-black">
                                                                            {t('common.no_data')}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {totalSearchPages > 1 && (
                                                                <div className="flex items-center justify-between p-2 bg-muted/20 border-t">
                                                                    <button
                                                                        disabled={searchPage === 1}
                                                                        onClick={() => setSearchPage(p => Math.max(1, p - 1))}
                                                                        className="p-1 hover:text-primary disabled:opacity-30 transition-colors"
                                                                    >
                                                                        <ChevronLeft className="h-4 w-4" />
                                                                    </button>
                                                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                                                                        {searchPage} / {totalSearchPages}
                                                                    </span>
                                                                    <button
                                                                        disabled={searchPage === totalSearchPages}
                                                                        onClick={() => setSearchPage(p => Math.min(totalSearchPages, p + 1))}
                                                                        className="p-1 hover:text-primary disabled:opacity-30 transition-colors"
                                                                    >
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            )}

                                                            <div className="bg-muted/50 p-2 flex justify-center border-t">
                                                                <button
                                                                    className="text-[9px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary transition-colors"
                                                                    onClick={() => {
                                                                        setActiveSearchBlockId(null);
                                                                        setSearchPage(1);
                                                                    }}
                                                                >
                                                                    {t('common.close').toUpperCase()}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};
