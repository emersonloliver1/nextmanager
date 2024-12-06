import { Navigate } from 'react-router-dom'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../config/firebase'
import { CircularProgress, Box } from '@mui/material'

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth)

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}
