interface ElectronAPI {
  openFile: () => Promise<string[]>
  showNotification: (options: { title: string, body: string }) => void
  onNewProject: (callback: () => void) => void
  platform: string
  version: string
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
} 