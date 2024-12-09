"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";
let win = null;
function createWindow() {
  const windowOptions = {
    width: 1280,
    height: 800,
    frame: process.platform === "darwin",
    // Usar frame nativo no macOS
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      preload: path.join(__dirname, "../preload/index.js")
    },
    backgroundColor: "#ffffff",
    show: false
  };
  win = new BrowserWindow(windowOptions);
  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
  win.once("ready-to-show", () => {
    win.show();
  });
  ipcMain.on("window-minimize", () => {
    win.minimize();
  });
  ipcMain.on("window-maximize", () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });
  ipcMain.on("window-close", () => {
    win.close();
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
process.on("uncaughtException", (error) => {
  console.error("Erro não tratado:", error);
});
