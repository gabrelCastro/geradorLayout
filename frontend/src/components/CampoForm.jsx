import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material'

const TIPOS_DADO = ['NUMERICO', 'ALFANUMERICO', 'DECIMAL']
const TIPOS_PREENCHIMENTO = ['ZERO_ESQUERDA', 'ESPACO_DIREITA', 'ESPACO_ESQUERDA']

const emptyCampo = {
  nome: '',
  posicaoInicial: 1,
  posicaoFinal: 1,
  tipo: 'ALFANUMERICO',
  preenchimento: 'ESPACO_DIREITA',
  obrigatorio: true,
  valorDefault: '',
}

function CampoForm({ open, onClose, onSubmit, campo }) {
  const [formData, setFormData] = useState(emptyCampo)

  useEffect(() => {
    if (open) {
      if (campo) {
        setFormData({ ...emptyCampo, ...campo })
      } else {
        setFormData(emptyCampo)
      }
    }
  }, [open, campo])

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [field]: value })
  }

  const handleNumberChange = (field) => (e) => {
    const value = parseInt(e.target.value, 10) || 0
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = () => {
    onSubmit(formData)
  }

  const tamanho = formData.posicaoFinal - formData.posicaoInicial + 1

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {campo ? 'Editar Campo' : 'Novo Campo'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nome"
            value={formData.nome}
            onChange={handleChange('nome')}
            required
            fullWidth
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Posicao Inicial"
              type="number"
              value={formData.posicaoInicial}
              onChange={handleNumberChange('posicaoInicial')}
              inputProps={{ min: 1 }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Posicao Final"
              type="number"
              value={formData.posicaoFinal}
              onChange={handleNumberChange('posicaoFinal')}
              inputProps={{ min: 1 }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Tamanho"
              value={tamanho > 0 ? tamanho : '-'}
              InputProps={{ readOnly: true }}
              sx={{ width: 100 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.tipo}
                label="Tipo"
                onChange={handleChange('tipo')}
              >
                {TIPOS_DADO.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Preenchimento</InputLabel>
              <Select
                value={formData.preenchimento}
                label="Preenchimento"
                onChange={handleChange('preenchimento')}
              >
                {TIPOS_PREENCHIMENTO.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Valor Default"
            value={formData.valorDefault}
            onChange={handleChange('valorDefault')}
            helperText="Valor usado quando o campo nao e preenchido"
            fullWidth
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.obrigatorio}
                onChange={handleChange('obrigatorio')}
              />
            }
            label="Campo obrigatorio"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {campo ? 'Salvar' : 'Adicionar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CampoForm
