import { Box, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import MinimizeIcon from '@mui/icons-material/Minimize'
import CropSquareIcon from '@mui/icons-material/CropSquare'

// Detecta se está rodando no Electron
const isElectron = window && 'electron' in window

// Obtém o ipcRenderer apenas se estiver no Electron
const ipcRenderer = isElectron ? (window as any).electron : null

export default function TitleBar() {
  // Se não estiver no Electron, não renderiza o componente
  if (!isElectron) return null

  const handleClose = () => {
    ipcRenderer?.send('window-close')
  }

  const handleMinimize = () => {
    ipcRenderer?.send('window-minimize')
  }

  const handleMaximize = () => {
    ipcRenderer?.send('window-maximize')
  }

  return (
    <Box
      sx={{
        height: '32px',
        bgcolor: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        WebkitAppRegion: 'drag',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }}
    >
      <Box sx={{ WebkitAppRegion: 'no-drag' }}>
        <IconButton
          size="small"
          onClick={handleMinimize}
          sx={{ color: 'white', borderRadius: 0, height: '32px' }}
        >
          <MinimizeIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleMaximize}
          sx={{ color: 'white', borderRadius: 0, height: '32px' }}
        >
          <CropSquareIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ color: 'white', borderRadius: 0, height: '32px' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}
