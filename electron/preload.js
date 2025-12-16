const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
    workspace: {
        select: () => ipcRenderer.invoke('workspace:select'),
        switch: (path) => ipcRenderer.invoke('workspace:switch', path),
        remove: (path) => ipcRenderer.invoke('workspace:remove', path)
    }
})
