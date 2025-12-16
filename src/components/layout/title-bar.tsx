'use client'

import React from 'react'

export function TitleBar() {
    return (
        <div
            className="h-10 w-full fixed top-0 left-0 z-50 flex items-center select-none"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            {/* Overlay to intercept clicks on window controls if needed, but 'drag' usually allows click-through to buttons if they are native */}
            {/* We just need this area to be draggable. The content below (like sidebar) will be pushed down or this will overlay. */}
            {/* If we overlay, user can't click elements under it. So sidebar needs paddingTop. */}
        </div>
    )
}
