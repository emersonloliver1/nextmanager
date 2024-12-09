import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { ptBR } from 'date-fns/locale';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Event {
  [key: string]: any;
  id?: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  userId: string;
}

export default function Calendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef);
      const querySnapshot = await getDocs(q);
      const eventsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventsList);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    }
  };

  const handleSaveEvent = async (event: Event) => {
    try {
      const eventData = {
        ...event,
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (event.id) {
        await updateDoc(doc(db, 'events', event.id), eventData);
      } else {
        await addDoc(collection(db, 'events'), eventData);
      }
      loadEvents();
      setOpenDialog(false);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, 'events', eventId));
      loadEvents();
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
    }
  };

  const getEventsByDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      reuniao: '#1976d2',
      compromisso: '#2e7d32',
      tarefa: '#ed6c02',
      outro: '#9c27b0'
    };
    return colors[type] || '#757575';
  };

  return (
    <Box p={3}>
      <Typography variant="h5" component="h1" gutterBottom>
        Agenda
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Eventos do Dia
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setCurrentEvent(null);
                  setOpenDialog(true);
                }}
              >
                Novo Evento
              </Button>
            </Box>

            <Box>
              {getEventsByDate(selectedDate).map((event) => (
                <Paper
                  key={event.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderLeft: 6,
                    borderColor: getEventTypeColor(event.type),
                  }}
                >
                  <Typography variant="h6">{event.title}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {event.startTime} - {event.endTime}
                  </Typography>
                  <Typography>{event.description}</Typography>
                  {event.location && (
                    <Typography color="textSecondary" sx={{ mt: 1 }}>
                      Local: {event.location}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DateCalendar
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue || new Date())}
              />
            </LocalizationProvider>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentEvent ? 'Editar Evento' : 'Novo Evento'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Título"
              margin="normal"
              value={currentEvent?.title || ''}
              onChange={(e) => setCurrentEvent(prev => ({ ...prev!, title: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="Descrição"
              margin="normal"
              multiline
              rows={3}
              value={currentEvent?.description || ''}
              onChange={(e) => setCurrentEvent(prev => ({ ...prev!, description: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="Data"
              type="date"
              margin="normal"
              value={currentEvent?.date || new Date().toISOString().split('T')[0]}
              onChange={(e) => setCurrentEvent(prev => ({ ...prev!, date: e.target.value }))}
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Hora Início"
                  type="time"
                  margin="normal"
                  value={currentEvent?.startTime || ''}
                  onChange={(e) => setCurrentEvent(prev => ({ ...prev!, startTime: e.target.value }))}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Hora Fim"
                  type="time"
                  margin="normal"
                  value={currentEvent?.endTime || ''}
                  onChange={(e) => setCurrentEvent(prev => ({ ...prev!, endTime: e.target.value }))}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={currentEvent?.type || 'outro'}
                onChange={(e) => setCurrentEvent(prev => ({ ...prev!, type: e.target.value as Event['type'] }))}
                label="Tipo"
              >
                <MenuItem value="reuniao">Reunião</MenuItem>
                <MenuItem value="compromisso">Compromisso</MenuItem>
                <MenuItem value="tarefa">Tarefa</MenuItem>
                <MenuItem value="outro">Outro</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Local"
              margin="normal"
              value={currentEvent?.location || ''}
              onChange={(e) => setCurrentEvent(prev => ({ ...prev!, location: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={() => handleSaveEvent(currentEvent || {
              title: '',
              description: '',
              date: new Date().toISOString().split('T')[0],
              startTime: '',
              endTime: '',
              type: 'outro'
            } as Event)}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 