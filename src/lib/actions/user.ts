'use server'

import { userService } from '@/lib/services/user'
import { revalidatePath } from 'next/cache'

export async function getUserSettings() {
    return await userService.getUserSettings()
}

export async function updateUserSettings(username: string, avatarUrl: string | null) {
    if (!username.trim()) throw new Error("Username required")

    await userService.updateUserSettings({ username, avatarUrl: avatarUrl || null })

    try {
        revalidatePath('/')
    } catch (e) {
        console.error("Revalidate failed (non-fatal)", e)
    }
}
