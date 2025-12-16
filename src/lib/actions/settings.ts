'use server'

import { settingsService, WorkspaceSettings } from '@/lib/services/settings'

export async function getWorkspaceSettings(): Promise<WorkspaceSettings> {
    return await settingsService.getSettings()
}

export async function saveWorkspaceSetting(key: keyof WorkspaceSettings, value: any) {
    await settingsService.updateSettings({ [key]: value })
}
