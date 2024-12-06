import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material'
import { useSignInWithEmailAndPassword, useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth'
import { auth } from '../config/firebase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const navigate = useNavigate()

  // Hook para login
  const [signInWithEmailAndPassword, user, loadingSignIn, errorSignIn] =
    useSignInWithEmailAndPassword(auth)

  // Hook para cadastro
  const [createUserWithEmailAndPassword, userSignUp, loadingSignUp, errorSignUp] =
    useCreateUserWithEmailAndPassword(auth)

  // Efeito para redirecionar após autenticação
  useEffect(() => {
    if (user || userSignUp) {
      navigate('/dashboard')
    }
  }, [user, userSignUp, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(email, password)
      } else {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem')
        }
        await createUserWithEmailAndPassword(email, password)
      }
    } catch (error) {
      console.error('Erro na autenticação:', error)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            component="img"
            src="/logo.svg"
            alt="NextManager Logo"
            sx={{ height: 50, mb: 4 }}
          />

          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            {isLogin ? 'Entrar no Sistema' : 'Criar Conta'}
          </Typography>

          {(errorSignIn || errorSignUp) && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {errorSignIn?.message || errorSignUp?.message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {!isLogin && (
              <TextField
                margin="normal"
                required
                fullWidth
                label="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={!isLogin}
              />
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={isLogin}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {!isLogin && (
              <TextField
                margin="normal"
                required
                fullWidth
                label="Confirmar Senha"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loadingSignIn || loadingSignUp}
              sx={{ mt: 3, mb: 2 }}
            >
              {loadingSignIn || loadingSignUp ? (
                <CircularProgress size={24} />
              ) : isLogin ? (
                'Entrar'
              ) : (
                'Cadastrar'
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setIsLogin(!isLogin)}
                sx={{ cursor: 'pointer' }}
              >
                {isLogin
                  ? 'Não tem uma conta? Cadastre-se'
                  : 'Já tem uma conta? Entre'}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
