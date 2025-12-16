const { app, BrowserWindow, screen, dialog, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { fork } = require('child_process')
const net = require('net')
const { findFreePort, updateConfig, removeConfig, getDataDir } = require('./utils')

const isDev = !app.isPackaged

let mainWindow
let serverProcess

// IPC Handlers for Workspace Management
ipcMain.handle('workspace:select', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Workspace Folder'
    })

    if (!result.canceled && result.filePaths.length > 0) {
        const newPath = result.filePaths[0]
        updateConfig(newPath)
        // No relaunch, just return success so frontend can refresh
        return { success: true, path: newPath }
    }
    return { success: false }
})

ipcMain.handle('workspace:switch', async (event, newPath) => {
    if (fs.existsSync(newPath)) {
        updateConfig(newPath)
        // We do NOT relaunch here for smooth switching.
        // The renderer calls a Server Action to hot-swap the backend services.
        // We only update config so that if the user DOES restart, it opens here.
        return { success: true }
    }
    return { success: false }
})

ipcMain.handle('workspace:remove', async (event, pathToRemove) => {
    removeConfig(pathToRemove)
    // We don't need to relaunch, just let the renderer reload its list
    // Or we could reload the window to refresh server props?
    // Since config is read in Server Components, a full window reload is safest to see changes.
    mainWindow.reload()
})

async function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize

    mainWindow = new BrowserWindow({
        width: Math.min(1280, width),
        height: Math.min(800, height),
        title: "Azurite",
        titleBarStyle: 'hidden',
        trafficLightPosition: { x: 12, y: 12 },
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url)
        }
        return { action: 'deny' }
    })

    const port = await findFreePort(3000)

    // GET DATA DIR INTERACTIVELY
    const dataDir = await getDataDir()
    console.log("Using Data Dir:", dataDir)

    // Pass DATA_DIR to the child process
    const env = {
        ...process.env,
        PORT: port,
        NODE_ENV: isDev ? 'development' : 'production',
        DATA_DIR: dataDir,
        USER_DATA_DIR: app.getPath('userData') // For reading config.json server-side
    }

    if (isDev) {
        // In dev, we assume 'npm run dev' is already running on 3000 usually, 
        // OR we can rely on this script to spawn it. 
        // Typically for 'electron:dev', we run next dev in parallel.
        // So we just load localhost:3000
        mainWindow.loadURL('http://localhost:3000')
        mainWindow.webContents.openDevTools()
    } else {
        // In production, we using extraResources, so standalone is in Resources/standalone
        // process.resourcesPath points to Contents/Resources

        const serverDir = path.join(process.resourcesPath, 'standalone')
        const serverPath = path.join(serverDir, 'server.js')

        console.log('Starting Next.js server from:', serverPath)

        serverProcess = fork(serverPath, [], {
            env,
            cwd: serverDir,
            stdio: ['ignore', 'pipe', 'pipe', 'ipc']
        })

        serverProcess.stdout.on('data', (data) => {
            console.log('Next.js [stdout]:', data.toString())
        })

        serverProcess.stderr.on('data', (data) => {
            console.error('Next.js [stderr]:', data.toString())
        })

        serverProcess.on('exit', (code) => {
            console.log('Next.js server exited with code:', code)
        })

        // Wait for server to be ready
        const checkServer = () => {
            const client = net.connect({ port }, () => {
                client.end()
                mainWindow.loadURL(`http://localhost:${port}`)
            })
            client.on('error', () => {
                setTimeout(checkServer, 1000)
            })
        }
        checkServer()
    }

    mainWindow.on('close', (event) => {
        if (!isQuitting && process.platform === 'darwin') {
            event.preventDefault()
            mainWindow.hide()
        } else {
            mainWindow = null
        }
    })

    mainWindow.on('closed', () => {
        // This will only fire if not strictly prevented or if we force closed
        mainWindow = null
        if (serverProcess) {
            serverProcess.kill()
        }
    })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    } else {
        mainWindow.show()
    }
})

let isQuitting = false

app.on('before-quit', () => {
    isQuitting = true
    if (serverProcess) {
        serverProcess.kill()
    }
})
