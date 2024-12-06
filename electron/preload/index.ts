import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // Funções do sistema de arquivos
  openFile: () => ipcRenderer.invoke('show-open-dialog'),
  
  // Notificações
  showNotification: (options: { title: string, body: string }) => 
    ipcRenderer.invoke('show-notification', options),
    
  // Listeners
  onNewProject: (callback: () => void) => 
    ipcRenderer.on('new-project', callback),
    
  // Informações do sistema
  platform: process.platform,
  version: process.versions.electron
})
