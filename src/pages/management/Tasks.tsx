import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Task {
  id?: string;
  title: string;
  description: string;
  priority: 'baixa' | 'media' | 'alta';
  status: 'pendente' | 'em_andamento' | 'concluida';
  dueDate: string;
  assignedTo: string;
  projectId?: string;
  completed: boolean;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef);
      const querySnapshot = await getDocs(q);
      const tasksList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksList);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  const handleSaveTask = async (task: Task) => {
    try {
      if (task.id) {
        await updateDoc(doc(db, 'tasks', task.id), task);
      } else {
        await addDoc(collection(db, 'tasks'), task);
      }
      loadTasks();
      setOpenDialog(false);
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      loadTasks();
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const updatedTask = { ...task, completed: !task.completed };
      await updateDoc(doc(db, 'tasks', task.id!), updatedTask);
      loadTasks();
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      baixa: 'success',
      media: 'warning',
      alta: 'error'
    };
    return colors[priority] || 'default';
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Tarefas
        </Typography>
        <Fab
          color="primary"
          size="medium"
          onClick={() => {
            setCurrentTask(null);
            setOpenDialog(true);
          }}
        >
          <AddIcon />
        </Fab>
      </Box>

      <List>
        {tasks.map((task) => (
          <ListItem
            key={task.id}
            sx={{
              mb: 1,
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 1
            }}
          >
            <Checkbox
              checked={task.completed}
              onChange={() => handleToggleComplete(task)}
            />
            <ListItemText
              primary={task.title}
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {task.description}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip
                      icon={<FlagIcon />}
                      label={task.priority}
                      size="small"
                      color={getPriorityColor(task.priority)}
                    />
                    <Chip
                      label={task.status.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Vence: ${new Date(task.dueDate).toLocaleDateString()}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              }
              sx={{
                textDecoration: task.completed ? 'line-through' : 'none',
                color: task.completed ? 'text.disabled' : 'text.primary'
              }}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => {
                  setCurrentTask(task);
                  setOpenDialog(true);
                }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                color="error"
                onClick={() => task.id && handleDeleteTask(task.id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentTask ? 'Editar Tarefa' : 'Nova Tarefa'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Título"
              margin="normal"
              defaultValue={currentTask?.title}
            />
            <TextField
              fullWidth
              label="Descrição"
              margin="normal"
              multiline
              rows={3}
              defaultValue={currentTask?.description}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Prioridade</InputLabel>
              <Select
                defaultValue={currentTask?.priority || 'media'}
                label="Prioridade"
              >
                <MenuItem value="baixa">Baixa</MenuItem>
                <MenuItem value="media">Média</MenuItem>
                <MenuItem value="alta">Alta</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Data de Vencimento"
              type="date"
              margin="normal"
              defaultValue={currentTask?.dueDate}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => handleSaveTask(currentTask || {} as Task)}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 