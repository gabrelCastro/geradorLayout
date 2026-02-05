import { useState } from 'react'
import {
  Box,
  TextField,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CampoForm from './CampoForm'

function RegistroForm({ registro, onChange }) {
  const [campoDialogOpen, setCampoDialogOpen] = useState(false)
  const [editingCampoIndex, setEditingCampoIndex] = useState(null)

  const handleChange = (field) => (e) => {
    onChange({ ...registro, [field]: e.target.value })
  }

  const handleAddCampo = () => {
    setEditingCampoIndex(null)
    setCampoDialogOpen(true)
  }

  const handleEditCampo = (index) => {
    setEditingCampoIndex(index)
    setCampoDialogOpen(true)
  }

  const handleRemoveCampo = (index) => {
    onChange({
      ...registro,
      campos: registro.campos.filter((_, i) => i !== index),
    })
  }

  const handleCampoSubmit = (campo) => {
    if (editingCampoIndex !== null) {
      const newCampos = [...registro.campos]
      newCampos[editingCampoIndex] = campo
      onChange({ ...registro, campos: newCampos })
    } else {
      onChange({
        ...registro,
        campos: [...(registro.campos || []), campo],
      })
    }
    setCampoDialogOpen(false)
  }

  const campos = registro.campos || []

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="Nome"
          value={registro.nome}
          onChange={handleChange('nome')}
          size="small"
          sx={{ flex: 1 }}
        />
        <TextField
          label="Codigo"
          value={registro.codigo}
          onChange={handleChange('codigo')}
          size="small"
          sx={{ width: 120 }}
        />
      </Box>
      <TextField
        label="Descricao"
        value={registro.descricao}
        onChange={handleChange('descricao')}
        size="small"
        fullWidth
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Typography variant="subtitle2">
          Campos ({campos.length})
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddCampo}
        >
          Adicionar Campo
        </Button>
      </Box>

      {campos.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Posicao</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Preenchimento</TableCell>
                <TableCell>Obrig.</TableCell>
                <TableCell>Default</TableCell>
                <TableCell align="right">Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campos
                .slice()
                .sort((a, b) => a.posicaoInicial - b.posicaoInicial)
                .map((campo, index) => {
                  const originalIndex = campos.findIndex((c) => c === campo)
                  return (
                    <TableRow key={index}>
                      <TableCell>{campo.nome}</TableCell>
                      <TableCell>
                        {campo.posicaoInicial}-{campo.posicaoFinal}
                      </TableCell>
                      <TableCell>{campo.tipo}</TableCell>
                      <TableCell>{campo.preenchimento}</TableCell>
                      <TableCell>{campo.obrigatorio ? 'Sim' : 'Nao'}</TableCell>
                      <TableCell>{campo.valorDefault || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEditCampo(originalIndex)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveCampo(originalIndex)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography color="text.secondary" align="center" sx={{ py: 1 }}>
          Nenhum campo adicionado
        </Typography>
      )}

      <CampoForm
        open={campoDialogOpen}
        onClose={() => setCampoDialogOpen(false)}
        onSubmit={handleCampoSubmit}
        campo={editingCampoIndex !== null ? campos[editingCampoIndex] : null}
      />
    </Box>
  )
}

export default RegistroForm
