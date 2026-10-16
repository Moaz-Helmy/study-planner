const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  loadData: () => ipcRenderer.invoke('db:load'),
  saveData: (data) => ipcRenderer.invoke('db:save', data),
  getDbPath: () => ipcRenderer.invoke('db:getPath'),
  revealDbInFolder: () => ipcRenderer.invoke('db:revealInFolder'),
  exportBackup: (data) => ipcRenderer.invoke('db:exportBackup', data),
  importBackup: () => ipcRenderer.invoke('db:importBackup'),
  notify: (payload) => ipcRenderer.invoke('app:notify', payload)
});
