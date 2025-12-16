'use server'

import { memoService } from '@/lib/services/memo'
import { revalidatePath } from 'next/cache'

export async function toggleReaction(memoId: string, emoji: string) {
    if (!memoId || !emoji) return;

    await memoService.toggleReaction(memoId, emoji)
    revalidatePath('/')
}
