import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import layoutApi from '../api/layoutApi'

const steps = ['Upload do PDF', 'Preview', 'Salvar']

function ImportPdfDialog({ open, onClose, onSuccess }) {
  const [activeStep, setActiveStep] = useState(0)
  const [file, setFile] = useState(null)
  const [nomeLayout, setNomeLayout] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewData, setPreviewData] = useState(null)

  const handleClose = () => {
    setActiveStep(0)
    setFile(null)
    setNomeLayout('')
    setError('')
    setPreviewData(null)
    onClose()
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError('')
    } else {
      setError('Por favor, selecione um arquivo PDF')
    }
  }

  const handleExtract = async () => {
    if (!file || !nomeLayout.trim()) {
      setError('Selecione um arquivo e informe o nome do layout')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await layoutApi.extrairLayoutDoPdf(file, nomeLayout.trim())
      setPreviewData(data)
      setActiveStep(1)
    } catch (err) {
      setError('Erro ao extrair layout: ' + (err.response?.data?.erro || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      await layoutApi.importarLayoutDoPdf(file, nomeLayout.trim())
      handleClose()
      onSuccess()
    } catch (err) {
      setError('Erro ao salvar layout: ' + (err.response?.data?.erro || err.message))
    } finally {
      setLoading(false)
    }
  }

  const renderStep0 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Nome do Layout"
        value={nomeLayout}
        onChange={(e) => setNomeLayout(e.target.value)}
        required
        fullWidth
      />

      <Paper
        variant="outlined"
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        onClick={() => document.getElementById('pdf-input').click()}
      >
        <input
          id="pdf-input"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography>
          {file ? file.name : 'Clique para selecionar um PDF'}
        </Typography>
        {file && (
          <Typography variant="body2" color="text.secondary">
            {(file.size / 1024).toFixed(1)} KB
          </Typography>
        )}
      </Paper>
    </Box>
  )

  const renderStep1 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="info">
        Verifique se os dados extraidos estao corretos antes de salvar.
      </Alert>

      {previewData && (
        <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {previewData.nome}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {previewData.descricao}
          </Typography>

          {previewData.registros?.map((registro, i) => (
            <Box key={i} sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                {registro.nome} ({registro.codigo}) - {registro.campos?.length || 0} campos
              </Typography>
              <Box sx={{ ml: 2, mt: 1 }}>
                {registro.campos?.slice(0, 5).map((campo, j) => (
                  <Typography key={j} variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {campo.posicaoInicial}-{campo.posicaoFinal}: {campo.nome} ({campo.tipo})
                  </Typography>
                ))}
                {registro.campos?.length > 5 && (
                  <Typography variant="body2" color="text.secondary">
                    ... e mais {registro.campos.length - 5} campos
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  )

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Importar Layout de PDF</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeStep === 0 && renderStep0()}
            {activeStep === 1 && renderStep1()}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        {activeStep === 0 && (
          <Button
            variant="contained"
            onClick={handleExtract}
            disabled={loading || !file || !nomeLayout.trim()}
          >
            Extrair
          </Button>
        )}
        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)} disabled={loading}>
              Voltar
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
            >
              Salvar Layout
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ImportPdfDialog
