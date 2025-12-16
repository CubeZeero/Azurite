'use client'

import React, { useState } from 'react'
import { CategoryData } from '@/lib/types'
import { SearchBar } from './search-bar'
import { CategoryList } from './category-list'
import { ScrollArea } from '@/components/ui/scroll-area'
import { WorkspaceSwitcher } from './workspace-switcher'
import { ModeToggle } from '@/components/mode-toggle'
import { WorkspaceConfig } from '@/lib/workspace'
import { DraggableHeader } from '@/components/layout/draggable-header'

interface SidebarContainerProps {
    categories: CategoryData[]
    config: WorkspaceConfig
}

export function SidebarContainer({ categories, config }: SidebarContainerProps) {
    const [query, setQuery] = useState('')

    // Recursive filter function
    const filterCategories = (cats: CategoryData[], q: string): CategoryData[] => {
        if (!q) return cats

        return cats.map(cat => {
            // Check if current category matches
            const matches = cat.name.toLowerCase().includes(q.toLowerCase())

            // Recursively filter children
            const filteredChildren = filterCategories(cat.children || [], q)
            const hasMatchingChildren = filteredChildren.length > 0

            // Return category if it matches OR has matching children
            // If it has matching children, we ensure filtered children are attached
            if (matches || hasMatchingChildren) {
                return {
                    ...cat,
                    children: filteredChildren,
                    // If filtering, we should arguably auto-expand, but for now just returning filtered structure
                }
            }
            return null
        }).filter(Boolean) as CategoryData[]
    }

    const filtered = filterCategories(categories, query)

    return (
        <div className="flex flex-col w-full border-r bg-sidebar text-sidebar-foreground h-full">
            {/* Draggable Header (Traffic Lights Space) */}
            <DraggableHeader className="h-10 shrink-0 w-full" />

            {/* Search Bar Area */}
            <div className="px-3 pb-2">
                <SearchBar value={query} onChange={setQuery} />
            </div>

            <ScrollArea className="flex-1">
                <div className="p-3 pt-0">
                    <CategoryList categories={filtered} forceExpand={!!query} />
                </div>
            </ScrollArea>

            <div className="p-3 border-t bg-sidebar-accent/5 flex items-center justify-between">
                <WorkspaceSwitcher config={config} />
                <ModeToggle />
            </div>
        </div>
    )
}
