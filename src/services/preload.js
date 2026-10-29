const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    windowMin: () => ipcRenderer.send('window-min'),
    windowMax: () => ipcRenderer.send('window-max'),
    windowClose: () => ipcRenderer.send('window-close'),
    setLanguage: (language) => ipcRenderer.send('set-language', language),
    runCommand: (cmd) => ipcRenderer.invoke('run-command', cmd),
    writeLog: (message, type) => ipcRenderer.send('write-log', { message, type }),
    readLogs: () => ipcRenderer.invoke('read-logs'),
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    getSystemSpecs: () => ipcRenderer.invoke('get-system-specs'),
    onSystemStats: (callback) => ipcRenderer.on('system-stats', (event, stats) => callback(stats)),
    onUpdateMessage: (callback) => ipcRenderer.on('update-message', (event, data) => callback(data))
});
