import { Box, CircularProgress, Typography } from '@mui/material'

export default function LoadingScreen() {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        zIndex: 9999,
      }}
    >
      <CircularProgress size={48} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Carregando...
      </Typography>
    </Box>
  )
}
