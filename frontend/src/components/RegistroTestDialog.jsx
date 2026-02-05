import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Snackbar,
  Grid,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import layoutApi from '../api/layoutApi'

function RegistroTestDialog({ open, onClose, registro }) {
  const [valores, setValores] = useState({})
  const [outputType, setOutputType] = useState('posicional')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [snackbar, setSnackbar] = useState(false)

  useEffect(() => {
    if (open && registro) {
      // Inicializa valores com defaults
      const initialValues = {}
      registro.campos?.forEach((campo) => {
        initialValues[campo.nome] = campo.valorDefault || ''
      })
      setValores(initialValues)
      setOutput('')
      setError('')
    }
  }, [open, registro])

  const handleValorChange = (nome) => (e) => {
    setValores({ ...valores, [nome]: e.target.value })
  }

  const handleGenerate = async () => {
    setError('')
    setLoading(true)

    try {
      if (outputType === 'json') {
        setOutput(JSON.stringify(valores, null, 2))
      } else {
        const response = await layoutApi.gerarRegistro({
          idRegistro: registro.id,
          valores,
        })
        setOutput(response.registroGerado)
      }
    } catch (err) {
      setError('Erro ao gerar: ' + (err.response?.data?.erro || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output)
      setSnackbar(true)
    }
  }

  const handleClear = () => {
    const clearedValues = {}
    registro?.campos?.forEach((campo) => {
      clearedValues[campo.nome] = ''
    })
    setValores(clearedValues)
    setOutput('')
  }

  if (!registro) return null

  const campos = registro.campos?.slice().sort((a, b) => a.posicaoInicial - b.posicaoInicial) || []

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">Testar Registro: {registro.nome}</Typography>
          {registro.codigo && (
            <Chip label={registro.codigo} size="small" variant="outlined" />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Preencha os campos e gere o registro em JSON ou Posicional
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Campos editaveis */}
        <Grid container spacing={2}>
          {campos.map((campo) => (
            <Grid item xs={12} sm={6} key={campo.nome}>
              <TextField
                label={campo.nome}
                value={valores[campo.nome] || ''}
                onChange={handleValorChange(campo.nome)}
                fullWidth
                size="small"
                helperText={
                  <Box component="span" sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`${campo.posicaoInicial}-${campo.posicaoFinal}`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={campo.tipo}
                      size="small"
                      color={campo.tipo === 'NUMERICO' ? 'primary' : campo.tipo === 'DECIMAL' ? 'secondary' : 'default'}
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={campo.preenchimento}
                      size="small"
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.7rem' }}
                    />
                  </Box>
                }
                InputProps={{
                  sx: { fontFamily: 'monospace' },
                }}
              />
            </Grid>
          ))}
        </Grid>

        {campos.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
            Nenhum campo definido neste registro
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Controles de output */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Saida
          </Typography>
          <ToggleButtonGroup
            value={outputType}
            exclusive
            onChange={(e, value) => value && setOutputType(value)}
            size="small"
          >
            <ToggleButton value="json">JSON</ToggleButton>
            <ToggleButton value="posicional">Posicional</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          value={output}
          InputProps={{
            readOnly: true,
            sx: { fontFamily: 'monospace' },
          }}
          placeholder="O resultado aparecera aqui..."
        />

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || campos.length === 0}
            startIcon={loading ? <CircularProgress size={16} /> : <PlayArrowIcon />}
          >
            Gerar
          </Button>
          <Button
            variant="outlined"
            onClick={handleCopy}
            disabled={!output}
            startIcon={<ContentCopyIcon />}
          >
            Copiar
          </Button>
          <Button
            variant="text"
            onClick={handleClear}
          >
            Limpar
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>

      <Snackbar
        open={snackbar}
        autoHideDuration={2000}
        onClose={() => setSnackbar(false)}
        message="Copiado!"
      />
    </Dialog>
  )
}

export default RegistroTestDialog
