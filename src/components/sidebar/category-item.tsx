'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { CategoryData } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Hash, Folder, ChevronRight, ChevronDown, MoreHorizontal, Trash, GripVertical, Pencil } from 'lucide-react'
import { moveCategory } from '@/lib/actions/category'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    useDraggable,
    useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export interface CategoryItemProps {
    category: CategoryData,
    level?: number,
    activeId: string,
    expanded: boolean,
    toggleExpand: (id: string, e: React.MouseEvent) => void,
    handleDelete: (id: string, e: React.MouseEvent) => void,
    children?: React.ReactNode,
    isEditing: boolean,
    onInternalRenameStart: () => void,
    onRenameSubmit: (name: string) => void,
    onRenameCancel: () => void
}

export function CategoryItem({
    category,
    level = 0,
    activeId,
    expanded,
    toggleExpand,
    handleDelete,
    children,
    isEditing,
    onInternalRenameStart,
    onRenameSubmit,
    onRenameCancel
}: CategoryItemProps) {
    const hasChildren = React.Children.count(children) > 0
    const isFolder = category.icon === 'folder' || hasChildren
    const [editName, setEditName] = useState(category.name)

    // Draggable setup
    const { attributes: dragAttributes, listeners: dragListeners, setNodeRef: setDragNodeRef, transform } = useDraggable({
        id: category.id,
        data: { type: 'category', category }
    });

    // Droppable setup (only for folders)
    const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
        id: category.id,
        disabled: !isFolder,
        data: { type: 'folder', category }
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        zIndex: 50
    } : undefined;

    return (
        <div ref={setDropNodeRef} className={cn("rounded-md transition-colors", isOver && "bg-sidebar-accent/30 box-border border-2 border-primary/20")}>
            <div
                ref={setDragNodeRef}
                style={style}
                className="flex items-center gap-1 group/item relative pr-7 py-1"
            >
                {/* Drag Handle */}
                <div {...dragListeners} {...dragAttributes} className="opacity-0 group-hover/item:opacity-50 hover:!opacity-100 cursor-grab px-1">
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>

                {/* Expand Toggle */}
                {hasChildren ? (
                    <button
                        onClick={(e) => toggleExpand(category.id, e)}
                        className="p-1 hover:bg-sidebar-accent rounded-sm text-muted-foreground transition-colors shrink-0"
                    >
                        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                ) : (
                    <div className="w-5 shrink-0" /> // Spacer
                )}

                {isEditing ? (
                    <div className="flex-1 px-2 py-0.5">
                        <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onRenameSubmit(editName)
                                if (e.key === 'Escape') onRenameCancel()
                            }}
                            onBlur={() => onRenameSubmit(editName)}
                            className="w-full text-sm bg-background border rounded px-1 h-7 focus:outline-none focus:ring-1 focus:ring-primary"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                        />
                    </div>
                ) : (
                    <Link
                        href={`/category/${category.id}`}
                        draggable={false}
                        className={cn(
                            "flex-1 flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors truncate",
                            activeId === category.id && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                    >
                        <span className={cn("mr-2 shrink-0", !isFolder && "text-muted-foreground")}>
                            {isFolder ? <Folder className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                        </span>
                        <span className="truncate">{category.name}</span>
                    </Link>
                )}

                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <div
                                onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                                className="flex items-center justify-center h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-sm cursor-pointer"
                            >
                                <MoreHorizontal className="h-3 w-3" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleDelete(category.id, e)} className="text-red-500 focus:text-red-500 cursor-pointer">
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                            {/* Rename Option */}
                            <DropdownMenuItem onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onInternalRenameStart()
                            }} className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                            </DropdownMenuItem>

                            {/* Move to Top Level Option (only if nested) */}
                            {category.parentId && (
                                <DropdownMenuItem onClick={async (e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    await moveCategory(category.id, null)
                                }} className="cursor-pointer">
                                    <Folder className="mr-2 h-4 w-4" />
                                    Move to Top Level
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Render Children */}
            {hasChildren && expanded && (
                <div className="ml-4 pl-2 border-l border-sidebar-border mt-1 flex flex-col gap-1">
                    {children}
                </div>
            )}
        </div>
    )
}
