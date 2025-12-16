'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { CategoryData } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Layers } from 'lucide-react'
import { CreateCategoryDialog } from './create-category-dialog'
import { deleteCategory, moveCategory, renameCategory } from '@/lib/actions/category'

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    useDroppable,
} from '@dnd-kit/core';

interface CategoryListProps {
    categories: CategoryData[]
    forceExpand?: boolean
}

import { CategoryItem } from './category-item'

export function CategoryList({ categories, forceExpand = false }: CategoryListProps) {
    const pathname = usePathname()
    const params = useParams()
    const activeId = params.id as string
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const [editingId, setEditingId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    );

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (window.confirm('Are you sure? This will delete all contents inside.')) {
            await deleteCategory(id)
        }
    }

    const handleRename = async (id: string, newName: string) => {
        // Always close editing first to prevent loop and revert UI
        setEditingId(null)

        if (newName && newName.trim()) {
            try {
                await renameCategory(id, newName)
            } catch (e: any) {
                // Use setTimeout to avoid onBlur/Focus loop issues with alert
                setTimeout(() => {
                    alert(e.message || "リネームに失敗しました")
                }, 10)
            }
        }
    }

    const { setNodeRef: setRootNodeRef, isOver: isOverRoot } = useDroppable({
        id: 'root-zone',
        data: { type: 'root' }
    });

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeId === overId) return;

        console.log(`Moving ${activeId} to ${overId}`);

        if (overId === 'root-zone') {
            await moveCategory(activeId, null);
        } else {
            await moveCategory(activeId, overId);
        }
    }

    // Recursive helper to build tree
    const buildTree = (parentId: string | null) => {
        return categories
            .filter(c => c.parentId === parentId)
            .map(category => (
                <CategoryItem
                    key={category.id}
                    category={category}
                    activeId={activeId}
                    expanded={forceExpand || expanded[category.id] || false}
                    toggleExpand={toggleExpand}
                    handleDelete={handleDelete}
                    isEditing={editingId === category.id}
                    onInternalRenameStart={() => setEditingId(category.id)}
                    onRenameSubmit={(newName) => handleRename(category.id, newName)}
                    onRenameCancel={() => setEditingId(null)}
                >
                    {buildTree(category.id)}
                </CategoryItem>
            ));
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col gap-1 py-2 h-full">
                <Link
                    href="/"
                    draggable={false}
                    className={cn(
                        "flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                        pathname === "/" && !activeId && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                >
                    <Layers className="h-4 w-4" />
                    All Notes
                </Link>

                <div className="flex items-center justify-between px-2 mt-4 mb-2 group">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                        Channels
                    </div>
                    <CreateCategoryDialog categories={categories} />
                </div>

                <div
                    ref={setRootNodeRef}
                    className={cn("flex flex-col gap-1 min-h-[100px] flex-1 pb-10 transition-colors rounded-md", isOverRoot && "bg-sidebar-accent/10 border-2 border-dashed border-sidebar-accent/50")}
                >
                    {buildTree(null)}
                </div>
            </div>
        </DndContext>
    )
}
