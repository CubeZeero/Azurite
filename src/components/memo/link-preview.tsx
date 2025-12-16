'use client'

import React, { useEffect, useState } from 'react'
import { getOgp, OgpData } from '@/lib/actions/ogp'
import { Skeleton } from '@/components/ui/skeleton'
import { EmbedCard } from './embed-card'

export function LinkPreview({ url }: { url: string }) {
    const [data, setData] = useState<OgpData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        let mounted = true
        getOgp(url)
            .then(d => {
                if (mounted) {
                    if (d) setData(d)
                    else setError(true)
                }
            })
            .catch(() => { if (mounted) setError(true) })
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [url])

    if (error) return null

    if (loading) {
        return (
            <div className="mt-2 w-full max-w-md border rounded-md overflow-hidden bg-card">
                <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                </div>
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }

    if (!data) return null;

    return (
        <EmbedCard
            url={url}
            borderColor="#888888" // Neutral gray for generic links
            author={data.siteName ? { name: data.siteName } : undefined}
            title={data.title}
            description={data.description}
            imageUrl={data.image}
        />
    )
}
