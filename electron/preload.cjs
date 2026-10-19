const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notesDesktop', {
  isElectron: true,
  getStore: () => ipcRenderer.invoke('store:get'),
  setStore: (json) => ipcRenderer.invoke('store:set', json),
  exportFile: (payload) => ipcRenderer.invoke('dialog:export', payload),
  pickImage: () => ipcRenderer.invoke('dialog:pick-image'),
  onMenuNewNote: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu:new-note', handler);
    return () => ipcRenderer.removeListener('menu:new-note', handler);
  },
});
