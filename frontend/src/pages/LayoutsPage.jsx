import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tooltip,
  InputAdornment,
  Card,
  CardContent,
  Fade,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import SearchIcon from '@mui/icons-material/Search'
import ViewListIcon from '@mui/icons-material/ViewList'
import layoutApi from '../api/layoutApi'
import LayoutForm from '../components/LayoutForm'
import ImportPdfDialog from '../components/ImportPdfDialog'
import LayoutViewDialog from '../components/LayoutViewDialog'

function LayoutsPage() {
  const [layouts, setLayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editingLayout, setEditingLayout] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [layoutToDelete, setLayoutToDelete] = useState(null)
  const [importPdfOpen, setImportPdfOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingLayout, setViewingLayout] = useState(null)

  // Buscar por nome
  const [searchNome, setSearchNome] = useState('')

  const fetchLayouts = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await layoutApi.getLayouts()
      setLayouts(data)
    } catch (err) {
      setError('Erro ao carregar layouts: ' + (err.response?.data?.erro || err.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLayouts()
  }, [])

  const handleSearch = async () => {
    if (!searchNome.trim()) {
      fetchLayouts()
      return
    }
    setLoading(true)
    setError('')
    try {
      const layout = await layoutApi.getLayoutByNome(searchNome.trim())
      setLayouts([layout])
    } catch (err) {
      if (err.response?.status === 404) {
        setLayouts([])
        setError('Layout nao encontrado')
      } else {
        setError('Erro ao buscar: ' + (err.response?.data?.erro || err.message))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingLayout(null)
    setFormOpen(true)
  }

  const handleEdit = (layout) => {
    setEditingLayout(layout)
    setFormOpen(true)
  }

  const handleView = (layout) => {
    setViewingLayout(layout)
    setViewDialogOpen(true)
  }

  const handleDeleteClick = (layout) => {
    setLayoutToDelete(layout)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!layoutToDelete) return
    try {
      await layoutApi.deletarLayout(layoutToDelete.id)
      setSuccess('Layout deletado com sucesso')
      setDeleteConfirmOpen(false)
      setLayoutToDelete(null)
      fetchLayouts()
    } catch (err) {
      setError('Erro ao deletar: ' + (err.response?.data?.erro || err.message))
    }
  }

  const handleFormSubmit = async (layoutDto) => {
    try {
      if (editingLayout) {
        await layoutApi.atualizarLayout(editingLayout.id, layoutDto)
        setSuccess('Layout atualizado com sucesso')
      } else {
        await layoutApi.criarLayout(layoutDto)
        setSuccess('Layout criado com sucesso')
      }
      setFormOpen(false)
      fetchLayouts()
    } catch (err) {
      throw err
    }
  }

  const handleImportSuccess = () => {
    setImportPdfOpen(false)
    setSuccess('Layout importado com sucesso')
    fetchLayouts()
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 0.5,
            }}
          >
            Gerenciar Layouts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crie, edite e gerencie seus layouts de registros posicionais
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => setImportPdfOpen(true)}
            sx={{ borderWidth: 2 }}
          >
            Importar PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{
              px: 3,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            }}
          >
            Novo Layout
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      <Fade in={!!error}>
        <Box>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
        </Box>
      </Fade>

      <Fade in={!!success}>
        <Box>
          {success && (
            <Alert
              severity="success"
              sx={{ mb: 2 }}
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          )}
        </Box>
      </Fade>

      {/* Search */}
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField
              placeholder="Buscar layout por nome..."
              value={searchNome}
              onChange={(e) => setSearchNome(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained" onClick={handleSearch} sx={{ px: 3 }}>
              Buscar
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setSearchNome('')
                fetchLayouts()
              }}
            >
              Limpar
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ border: '1px solid', borderColor: 'divider' }} elevation={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : layouts.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 8,
              px: 2,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: 3,
                backgroundColor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <ViewListIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhum layout encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Crie um novo layout ou importe de um PDF
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
            >
              Criar Layout
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 80 }}>ID</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Descricao</TableCell>
                  <TableCell sx={{ width: 140 }}>Registros</TableCell>
                  <TableCell align="right" sx={{ width: 150 }}>
                    Acoes
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {layouts.map((layout) => (
                  <TableRow
                    key={layout.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={`#${layout.id}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>{layout.nome}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {layout.descricao || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${layout.registros?.length || 0} registro(s)`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Visualizar">
                          <IconButton
                            size="small"
                            onClick={() => handleView(layout)}
                            sx={{
                              backgroundColor: 'action.hover',
                              '&:hover': { backgroundColor: 'primary.light', color: 'white' },
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(layout)}
                            sx={{
                              backgroundColor: 'action.hover',
                              '&:hover': { backgroundColor: 'primary.light', color: 'white' },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Deletar">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(layout)}
                            sx={{
                              backgroundColor: 'action.hover',
                              '&:hover': { backgroundColor: 'error.light', color: 'white' },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Dialogs */}
      <LayoutForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        layout={editingLayout}
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>Confirmar exclusao</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o layout{' '}
            <strong>"{layoutToDelete?.nome}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acao nao pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <ImportPdfDialog
        open={importPdfOpen}
        onClose={() => setImportPdfOpen(false)}
        onSuccess={handleImportSuccess}
      />

      <LayoutViewDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        layout={viewingLayout}
      />
    </Box>
  )
}

export default LayoutsPage
