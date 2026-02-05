import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RegistroForm from './RegistroForm'

const emptyLayout = {
  nome: '',
  descricao: '',
  registros: [],
}

function LayoutForm({ open, onClose, onSubmit, layout }) {
  const [formData, setFormData] = useState(emptyLayout)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      if (layout) {
        // Editar - converter entidade para DTO
        setFormData({
          nome: layout.nome || '',
          descricao: layout.descricao || '',
          registros: (layout.registros || []).map((r) => ({
            nome: r.nome || '',
            descricao: r.descricao || '',
            codigo: r.codigo || '',
            campos: (r.campos || []).map((c) => ({
              nome: c.nome || '',
              posicaoInicial: c.posicaoInicial || 1,
              posicaoFinal: c.posicaoFinal || 1,
              tipo: c.tipo || 'ALFANUMERICO',
              preenchimento: c.preenchimento || 'ESPACO_DIREITA',
              obrigatorio: c.obrigatorio ?? true,
              valorDefault: c.valorDefault || '',
            })),
          })),
        })
      } else {
        setFormData(emptyLayout)
      }
      setError('')
    }
  }, [open, layout])

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value })
  }

  const handleAddRegistro = () => {
    setFormData({
      ...formData,
      registros: [
        ...formData.registros,
        { nome: '', descricao: '', codigo: '', campos: [] },
      ],
    })
  }

  const handleRemoveRegistro = (index) => {
    setFormData({
      ...formData,
      registros: formData.registros.filter((_, i) => i !== index),
    })
  }

  const handleRegistroChange = (index, registro) => {
    const newRegistros = [...formData.registros]
    newRegistros[index] = registro
    setFormData({ ...formData, registros: newRegistros })
  }

  const handleSubmit = async () => {
    setError('')
    if (!formData.nome.trim()) {
      setError('Nome e obrigatorio')
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err.response?.data?.erro || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {layout ? 'Editar Layout' : 'Novo Layout'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nome"
            value={formData.nome}
            onChange={handleChange('nome')}
            required
            fullWidth
          />
          <TextField
            label="Descricao"
            value={formData.descricao}
            onChange={handleChange('descricao')}
            multiline
            rows={2}
            fullWidth
          />

          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Registros ({formData.registros.length})
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddRegistro}
            >
              Adicionar Registro
            </Button>
          </Box>

          {formData.registros.map((registro, index) => (
            <Accordion key={index} defaultExpanded={formData.registros.length === 1}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <Typography>
                    {registro.nome || `Registro ${index + 1}`}
                  </Typography>
                  {registro.codigo && (
                    <Chip label={registro.codigo} size="small" variant="outlined" />
                  )}
                  <Chip
                    label={`${registro.campos?.length || 0} campo(s)`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveRegistro(index)
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </AccordionSummary>
              <AccordionDetails>
                <RegistroForm
                  registro={registro}
                  onChange={(r) => handleRegistroChange(index, r)}
                />
              </AccordionDetails>
            </Accordion>
          ))}

          {formData.registros.length === 0 && (
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              Nenhum registro adicionado
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LayoutForm
