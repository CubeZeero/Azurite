const { app, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const net = require('net')

// Helper to find a free port
function findFreePort(startPort) {
    return new Promise((resolve, reject) => {
        const server = net.createServer()
        server.listen(startPort, () => {
            const port = server.address().port
            server.close(() => resolve(port))
        })
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                findFreePort(startPort + 1).then(resolve, reject)
            } else {
                reject(err)
            }
        })
    })
}

function updateConfig(newPath) {
    if (!newPath) return

    const configPath = path.join(app.getPath('userData'), 'config.json')
    let config = { dataDir: newPath, history: [] }
    try {
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        }
    } catch { }

    config.dataDir = newPath

    // Update History
    if (!config.history) config.history = []
    // Remove if exists to push to top
    config.history = config.history.filter(p => p !== newPath)
    config.history.unshift(newPath)

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

function removeConfig(pathToRemove) {
    const configPath = path.join(app.getPath('userData'), 'config.json')
    let config = { dataDir: '', history: [] }
    try {
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        }
    } catch { }

    if (config.history) {
        config.history = config.history.filter(p => p !== pathToRemove)

        // If current dataDir is removed, switch to next available or empty
        if (config.dataDir === pathToRemove) {
            config.dataDir = config.history.length > 0 ? config.history[0] : ''
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    }
}

async function getDataDir() {
    const configPath = path.join(app.getPath('userData'), 'config.json')
    let config = { history: [] }

    // Try to read existing config
    try {
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        }
    } catch (e) {
        console.error("Failed to read config:", e)
    }

    let dataDir = config.dataDir

    // Validate existance
    let valid = false
    if (dataDir) {
        try {
            if (fs.existsSync(dataDir)) {
                valid = true
            }
        } catch { }
    }

    // If not valid, return empty string (Renderer handles Welcome Screen)
    if (!valid) {
        // We don't prompt here anymore. The Welcome Page will handle it.
        return ''
    }

    // Always update config to ensure history is correct on boot
    updateConfig(dataDir)

    return dataDir
}

module.exports = {
    findFreePort,
    updateConfig,
    removeConfig,
    getDataDir
}
