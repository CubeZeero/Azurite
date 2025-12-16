import { useEffect, useState } from 'react'
import { fetchTweet } from '@/lib/actions/tweet'
import { EmbedCard } from './embed-card'
import { Tweet } from 'react-tweet/api'

// Simple X icon
const XIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
)

export function TweetPreview({ id }: { id: string }) {
    const [tweet, setTweet] = useState<Tweet | undefined>(undefined)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        fetchTweet(id).then(data => {
            if (mounted && data) setTweet(data)
        }).finally(() => {
            if (mounted) setLoading(false)
        })
        return () => { mounted = false }
    }, [id])

    if (loading) {
        return (
            <div className="flex w-full max-w-md mt-2 h-24 bg-muted/30 rounded-md animate-pulse" />
        )
    }

    if (!tweet) return null

    // Extract relevant data
    const photo = tweet.photos?.[0]
    const video = tweet.video
    const imageUrl = video?.poster || photo?.url
    const date = new Date(tweet.created_at).toLocaleString()

    return (
        <EmbedCard
            url={`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`}
            borderColor="#1DA1F2" // Twitter Blue
            author={{
                name: tweet.user.name,
                handle: tweet.user.screen_name,
                url: `https://twitter.com/${tweet.user.screen_name}`
            }}
            description={tweet.text}
            imageUrl={imageUrl}
            footer={{
                icon: <XIcon />,
                text: `X • ${date}`
            }}
        />
    )
}

