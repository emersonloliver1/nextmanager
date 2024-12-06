const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

let win = null

function createWindow() {
  // Configurações específicas para cada plataforma
  const windowOptions = {
    width: 1280,
    height: 800,
    frame: process.platform === 'darwin', // Usar frame nativo no macOS
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
    backgroundColor: '#ffffff',
    show: false,
  }

  // Criar a janela principal
  win = new BrowserWindow(windowOptions)

  // Em desenvolvimento, carrega do servidor Vite
  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    // Em produção, carrega do arquivo local
    win.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  // Mostrar a janela quando estiver pronta
  win.once('ready-to-show', () => {
    win.show()
  })

  // Eventos de controle da janela
  ipcMain.on('window-minimize', () => {
    win.minimize()
  })

  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    win.close()
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })
}

// Criar janela quando o app estiver pronto
app.whenReady().then(createWindow)

// Sair quando todas as janelas estiverem fechadas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// No macOS, recriar a janela quando clicar no ícone do dock
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Manipular erros não tratados
process.on('uncaughtException', (error) => {
  console.error('Erro não tratado:', error)
})
