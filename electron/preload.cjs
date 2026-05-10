const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hourlyBridge', {
  notify: (opts) => ipcRenderer.invoke('notify', opts)
});
