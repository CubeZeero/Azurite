'use client'

import React from 'react'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable'
import { cn } from '@/lib/utils'

interface ResizableLayoutProps {
    sidebar: React.ReactNode
    children: React.ReactNode
    details: React.ReactNode
}

import { useSearchParams } from 'next/navigation'
import { ImperativePanelHandle } from 'react-resizable-panels'

interface ResizableLayoutProps {
    sidebar: React.ReactNode
    children: React.ReactNode
    details: React.ReactNode
}

export function ResizableLayout({ sidebar, children, details }: ResizableLayoutProps) {
    const searchParams = useSearchParams()
    const memoId = searchParams.get('memoId')
    const detailsPanelRef = React.useRef<ImperativePanelHandle>(null)

    // Using default sizes: 20% sidebar, 60% main, 20% details (approx)
    React.useEffect(() => {
        const panel = detailsPanelRef.current
        if (panel) {
            if (memoId) {
                // Expand if closed, or ensure visible
                panel.expand()
            } else {
                // Collapse if no memo
                panel.collapse()
            }
        }
    }, [memoId])

    return (
        <ResizablePanelGroup direction="horizontal" className="h-full w-full rounded-lg border">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <div className="h-full w-full">
                    {sidebar}
                </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={80} minSize={30}>
                <div className="h-full w-full">
                    {children}
                </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel
                ref={detailsPanelRef}
                defaultSize={0}
                minSize={20}
                maxSize={40}
                collapsible={true}
                collapsedSize={0}
            >
                <div className="h-full w-full">
                    {details}
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
