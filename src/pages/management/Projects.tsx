import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Grid, 
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';

interface Project {
  id?: string;
  name: string;
  description: string;
  status: 'planejamento' | 'em_andamento' | 'concluido' | 'pausado';
  startDate: string;
  endDate: string;
  team: string[];
  progress: number;
}

export default function Projects() {
  const [user, authLoading] = useAuthState(auth);
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    if (!user) {
      console.error('Usuário não autenticado');
      navigate('/login');
      return;
    }

    try {
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef);
      const querySnapshot = await getDocs(q);
      const projectsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsList);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  const handleSaveProject = async (project: Project) => {
    try {
      if (project.id) {
        await updateDoc(doc(db, 'projects', project.id), project);
      } else {
        await addDoc(collection(db, 'projects'), project);
      }
      loadProjects();
      setOpenDialog(false);
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      loadProjects();
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      planejamento: 'info',
      em_andamento: 'warning',
      concluido: 'success',
      pausado: 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Gestão de Projetos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setCurrentProject(null);
            setOpenDialog(true);
          }}
        >
          Novo Projeto
        </Button>
      </Box>

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <Card sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="h6" component="h2">
                  {project.name}
                </Typography>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setCurrentProject(project);
                      setOpenDialog(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => project.id && handleDeleteProject(project.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
              
              <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                {project.description}
              </Typography>

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Chip
                  label={project.status.replace('_', ' ')}
                  color={getStatusColor(project.status)}
                  size="small"
                />
                <Typography variant="body2">
                  Progresso: {project.progress}%
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentProject ? 'Editar Projeto' : 'Novo Projeto'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nome do Projeto"
              margin="normal"
              defaultValue={currentProject?.name}
            />
            <TextField
              fullWidth
              label="Descrição"
              margin="normal"
              multiline
              rows={3}
              defaultValue={currentProject?.description}
            />
            {/* Adicionar mais campos conforme necessário */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => handleSaveProject(currentProject || {} as Project)}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 