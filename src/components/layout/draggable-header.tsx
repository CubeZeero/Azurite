'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface DraggableHeaderProps {
    className?: string
    children?: React.ReactNode
}

export function DraggableHeader({ className, children }: DraggableHeaderProps) {
    return (
        <div
            className={cn("w-full h-10 shrink-0 flex items-center select-none", className)}
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            {/* Inject a style to make direct children non-draggable by default or use a utility class */}
            {/* However, CSS modules or global styles work best. For now, we will rely on utility classes on children. */}
            {/* IMPORTANT: Any interactive element inside MUST have the class "no-drag" or style={{ WebkitAppRegion: 'no-drag' }} */}
            {children}
        </div>
    )
}
