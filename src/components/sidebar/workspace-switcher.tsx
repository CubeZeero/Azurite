'use client'

import React, { useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Folder, Plus, Check, X } from 'lucide-react'
import { WorkspaceConfig } from '@/lib/workspace'
import { useRouter } from 'next/navigation'

interface Props {
    config: WorkspaceConfig
}

export function WorkspaceSwitcher({ config }: Props) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const currentName = config.dataDir.split('/').pop() || 'Notebook'

    const handleSelect = async () => {
        if (window.electron?.workspace) {
            await window.electron.workspace.select()
        }
    }

    const handleSwitch = async (path: string) => {
        if (window.electron?.workspace) {
            await window.electron.workspace.switch(path)
            setOpen(false)
            router.push('/')
            router.refresh()
        }
    }

    const handleRemove = async (path: string, name: string) => {
        if (window.electron?.workspace) {
            if (confirm(`Remove "${name}" from list? (Folder will not be deleted)`)) {
                await window.electron.workspace.remove(path)
                router.refresh()
            }
        }
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-sidebar-accent/50 cursor-pointer transition-colors flex-1">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                        <Folder className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                        <span className="text-sm font-medium truncate max-w-[120px]">{currentName}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">Switch...</span>
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start" side="top">
                <DropdownMenuLabel>Notebooks</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {config.history.map((path) => {
                    const name = path.split('/').pop()
                    const isCurrent = path === config.dataDir
                    return (
                        <DropdownMenuItem key={path} onSelect={() => handleSwitch(path)} className="flex justify-between group/item">
                            <span className="truncate max-w-[150px]">{name}</span>
                            <div className="flex items-center gap-2">
                                {isCurrent && <Check className="h-4 w-4" />}
                                <div
                                    role="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleRemove(path, name || 'Notebook')
                                    }}
                                    className="opacity-0 group-hover/item:opacity-100 hover:text-destructive transition-opacity p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </div>
                            </div>
                        </DropdownMenuItem>
                    )
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSelect}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Notebook...
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
