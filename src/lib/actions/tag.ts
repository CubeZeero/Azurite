'use server'

import { tagService } from '@/lib/services/tag'
import { revalidatePath } from 'next/cache'

export async function addTagToMemo(memoId: string, tagName: string) {
    const normalizedName = tagName.trim()
    if (!normalizedName) return

    await tagService.addTagToMemo(memoId, normalizedName)

    try {
        revalidatePath('/')
    } catch (e) {
        console.error("Revalidate failed (non-fatal)", e)
    }
}

export async function searchTags(query: string) {
    if (!query) return []
    return await tagService.getTags(query)
}
