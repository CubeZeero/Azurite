import { promises as fs } from 'fs'
import path from 'path'
import { BaseService } from './base'
import { JsonStorage } from './json-storage'

class UserService extends BaseService {
    constructor() {
        super()
    }

    async getUserSettings(): Promise<{ id: string, username: string, avatarUrl: string | null }> {
        await this.init()
        const systemDir = path.join(this.rootDir, '_system')
        const userPath = path.join(systemDir, 'user.json')

        // Use JsonStorage
        const settings = await JsonStorage.read<{ id: string, username: string, avatarUrl: string | null }>(userPath)

        if (settings) {
            return settings
        }

        // Default settings
        const defaultSettings = {
            id: 'default',
            username: 'User',
            avatarUrl: null
        }
        await JsonStorage.write(userPath, defaultSettings)
        return defaultSettings
    }

    async updateUserSettings(data: { username: string, avatarUrl: string | null }) {
        await this.init()
        const systemDir = path.join(this.rootDir, '_system')
        const userPath = path.join(systemDir, 'user.json')

        const current = await this.getUserSettings()
        const updated = { ...current, ...data }
        await JsonStorage.write(userPath, updated)
    }
}

export const userService = new UserService()
