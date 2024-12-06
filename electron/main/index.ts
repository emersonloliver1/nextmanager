import { app, BrowserWindow, ipcMain, dialog, Menu, Notification } from 'electron'
import path from 'node:path'

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js
// │ └─┬ preload
// │   └── index.js
// ├─┬ dist
// │ └── index.html

process.env.DIST_ELECTRON = path.join(__dirname, '..')
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = app.isPackaged 
  ? process.env.DIST 
  : path.join(process.env.DIST_ELECTRON, '../public')

let win: BrowserWindow | null = null

// Menu personalizado
const template = [
  {
    label: 'Arquivo',
    submenu: [
      { label: 'Novo Projeto', click: () => win?.webContents.send('new-project') },
      { type: 'separator' },
      { role: 'quit', label: 'Sair' }
    ]
  },
  {
    label: 'Editar',
    submenu: [
      { role: 'undo', label: 'Desfazer' },
      { role: 'redo', label: 'Refazer' },
      { type: 'separator' },
      { role: 'cut', label: 'Recortar' },
      { role: 'copy', label: 'Copiar' },
      { role: 'paste', label: 'Colar' }
    ]
  }
]

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
    show: false, // Não mostrar a janela até estar pronta
    icon: path.join(process.env.PUBLIC, 'icon.png')
  })

  // Configurar menu
  const menu = Menu.buildFromTemplate(template as any)
  Menu.setApplicationMenu(menu)

  // Mostrar janela quando estiver pronta
  win.once('ready-to-show', () => {
    win?.show()
  })

  // Test active push message to Renderer-Process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

// Handlers IPC
ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections']
  })
  return result.filePaths
})

ipcMain.handle('show-notification', async (_, { title, body }) => {
  new Notification({ title, body }).show()
})

// Verificar atualizações ao iniciar
app.whenReady().then(() => {
  createWindow()
  
  // Exemplo de notificação de boas-vindas
  new Notification({
    title: 'NextManager',
    body: 'Bem-vindo ao NextManager Desktop!'
  }).show()
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length === 0) {
    createWindow()
  } else {
    allWindows[0].focus()
  }
})
