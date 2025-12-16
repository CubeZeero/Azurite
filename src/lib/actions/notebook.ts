'use server'

import { memoService } from '@/lib/services/memo'
import { categoryService } from '@/lib/services/category'
import { tagService } from '@/lib/services/tag'
import { userService } from '@/lib/services/user'
import { settingsService } from '@/lib/services/settings'

export async function switchNotebookAction(newPath: string) {
    console.log(`[Server] Switching notebook to: ${newPath}`)

    // Update all services
    memoService.setRootDir(newPath)
    categoryService.setRootDir(newPath)
    tagService.setRootDir(newPath)
    userService.setRootDir(newPath)
    settingsService.setRootDir(newPath)

    return { success: true }
}
