import { Box, Typography, Paper } from '@mui/material'

interface ComingSoonProps {
  module: string
}

export default function ComingSoon({ module }: ComingSoonProps) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {module}
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Este módulo está em desenvolvimento
        </Typography>
      </Paper>
    </Box>
  )
} 