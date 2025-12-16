'use client'

import { useEffect, useState } from 'react'
import { getOgp, OgpData } from '@/lib/actions/ogp'
import { EmbedCard } from './embed-card'
import { Skeleton } from '@/components/ui/skeleton'

export function YoutubePreview({ videoId }: { videoId: string }) {
    const url = `https://www.youtube.com/watch?v=${videoId}`
    const [data, setData] = useState<OgpData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        getOgp(url)
            .then(d => {
                if (mounted && d) setData(d)
                // If it fails, we can still render just the player with defaults or generic info
            })
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [url])

    const Player = (
        <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            className="absolute top-0 left-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
        />
    )

    if (loading) {
        return (
            <div className="mt-2 w-full max-w-md border rounded-md overflow-hidden bg-card">
                <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="w-full aspect-video bg-muted animate-pulse" />
            </div>
        )
    }

    // Fallback if no OGP data found (should be rare for YT)
    if (!data) {
        return (
            <div className="mt-2 w-full max-w-md bg-black rounded-md overflow-hidden shadow-sm border border-red-500/30">
                <div className="relative w-full aspect-video">
                    {Player}
                </div>
            </div>
        )
    }

    return (
        <EmbedCard
            url={url}
            borderColor="#FF0000" // YouTube Red
            author={{
                name: data.siteName || 'YouTube',
                url: 'https://www.youtube.com',
            }}
            title={data.title}
            description={data.description}
            media={Player}
            footer={{
                text: 'YouTube'
            }}
        />
    )
}
