'use server'

import { getTweet } from 'react-tweet/api'

export async function fetchTweet(id: string) {
    try {
        const tweet = await getTweet(id)
        return tweet
    } catch (error) {
        console.error("Error fetching tweet:", error)
        return null
    }
}
