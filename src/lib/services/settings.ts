import { BaseService } from './base'
import { promises as fs } from 'fs'
import path from 'path'

export interface WorkspaceSettings {
    viewMode: 'list' | 'grid'
}

const DEFAULT_SETTINGS: WorkspaceSettings = {
    viewMode: 'list'
}

export class SettingsService extends BaseService {
    private settingsFile = 'settings.json' // Saved in _system/settings.json

    private getSettingsPath() {
        return path.join(this.rootDir, '_system', this.settingsFile)
    }

    async getSettings(): Promise<WorkspaceSettings> {
        await this.init()

        // Migration: If .system exists and _system does not, rename it
        const oldSystemDir = path.join(this.rootDir, '.system')
        const newSystemDir = path.join(this.rootDir, '_system')

        try {
            await fs.access(oldSystemDir)
            try {
                await fs.access(newSystemDir)
                // Both exist, ignore old one (or could merge, but rename is safer if new is likely empty/non-existent)
            } catch {
                // New doesn't exist, rename old
                await fs.rename(oldSystemDir, newSystemDir)
            }
        } catch {
            // Old doesn't exist, fine
        }

        try {
            const data = await fs.readFile(this.getSettingsPath(), 'utf-8')
            return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
        } catch (error) {
            // If file doesn't exist or is invalid, return defaults
            return DEFAULT_SETTINGS
        }
    }

    async updateSettings(settings: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
        await this.init()
        const current = await this.getSettings() // This handles migration
        const updated = { ...current, ...settings }

        const systemDir = path.join(this.rootDir, '_system')
        try {
            await fs.access(systemDir)
        } catch {
            await fs.mkdir(systemDir, { recursive: true })
        }

        await fs.writeFile(this.getSettingsPath(), JSON.stringify(updated, null, 2))
        return updated
    }
}

export const settingsService = new SettingsService()
