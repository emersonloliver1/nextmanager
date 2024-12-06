import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { auth, db } from '../config/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Settings() {
  const [user] = useAuthState(auth);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateFile = (file: File) => {
    // Verificar tamanho (max 500KB para base64)
    if (file.size > 500 * 1024) {
      throw new Error('A imagem deve ter no máximo 500KB');
    }

    // Verificar tipo
    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo deve ser uma imagem');
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const resizeImage = (base64Str: string, maxWidth = 100, maxHeight = 100): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = maxWidth;
        const MAX_HEIGHT = maxHeight;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Converter para JPEG com qualidade reduzida
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !user) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const file = event.target.files[0];
      validateFile(file);
      
      // Converter para base64
      const base64Image = await convertToBase64(file);
      
      // Criar versão reduzida para o Auth
      const thumbnailImage = await resizeImage(base64Image);
      
      // Salvar imagem completa no Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        photoURL: base64Image,
        thumbnailURL: thumbnailImage,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Atualizar perfil do usuário com a versão reduzida
      await updateProfile(user, { photoURL: thumbnailImage });
      
      setSuccess('Foto atualizada com sucesso!');
      // Forçar atualização do usuário
      await user.reload();
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setError(err.message || 'Erro ao atualizar a foto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Atualizar perfil do usuário
      await updateProfile(user, {
        displayName: displayName,
      });

      // Atualizar no Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: displayName,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Forçar atualização do usuário
      await user.reload();
      setSuccess('Perfil atualizado com sucesso!');
    } catch (err: any) {
      console.error('Erro na atualização:', err);
      setError(err.message || 'Erro ao atualizar o perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados do usuário do Firestore
  const loadUserData = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.displayName) {
          setDisplayName(data.displayName);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  // Carregar dados ao montar o componente
  useState(() => {
    loadUserData();
  }, [user]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Configurações
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Perfil do Usuário
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={user?.photoURL || undefined}
              sx={{ 
                width: 100, 
                height: 100,
                border: '2px solid',
                borderColor: 'primary.main'
              }}
            />
            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="photo-upload"
                type="file"
                onChange={handlePhotoUpload}
                disabled={loading}
              />
              <label htmlFor="photo-upload">
                <IconButton
                  color="primary"
                  component="span"
                  disabled={loading}
                >
                  <PhotoCamera />
                </IconButton>
              </label>
              <Typography variant="body2" color="text.secondary">
                Clique para alterar a foto
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Tamanho máximo: 500KB
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nome"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              helperText="Este é o nome que será exibido para outros usuários"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              value={user?.email || ''}
              disabled
              helperText="O email não pode ser alterado"
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleUpdateProfile}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Salvar Alterações
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
} 