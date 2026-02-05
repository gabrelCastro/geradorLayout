import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Alert,
  Typography,
  Card,
  CardContent,
  Fade,
  Stepper,
  Step,
  StepLabel,
  Chip,
} from '@mui/material'
import TransformIcon from '@mui/icons-material/Transform'
import LayoutSelector from '../components/LayoutSelector'
import RegistroSelector from '../components/RegistroSelector'
import InputArea from '../components/InputArea'
import FieldEditor from '../components/FieldEditor'
import OutputArea from '../components/OutputArea'
import layoutApi from '../api/layoutApi'

function ConverterPage() {
  const [layouts, setLayouts] = useState([])
  const [selectedLayout, setSelectedLayout] = useState(null)
  const [selectedRegistro, setSelectedRegistro] = useState(null)
  const [valores, setValores] = useState({})
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingLayouts, setLoadingLayouts] = useState(true)
  const [error, setError] = useState('')

  // Carregar layouts ao iniciar
  useEffect(() => {
    const fetchLayouts = async () => {
      try {
        const data = await layoutApi.getLayouts()
        setLayouts(data)
      } catch (err) {
        setError('Erro ao carregar layouts: ' + (err.response?.data?.erro || err.message))
      } finally {
        setLoadingLayouts(false)
      }
    }
    fetchLayouts()
  }, [])

  // Limpar registro ao mudar layout
  const handleLayoutSelect = (layout) => {
    setSelectedLayout(layout)
    setSelectedRegistro(null)
    setValores({})
    setOutput('')
    setError('')
  }

  // Limpar valores ao mudar registro
  const handleRegistroSelect = (registro) => {
    setSelectedRegistro(registro)
    setValores({})
    setOutput('')
    setError('')
  }

  // Carregar valores do input
  const handleLoad = async ({ type, data }) => {
    setError('')
    setLoading(true)

    try {
      if (type === 'json') {
        // JSON direto - só preenche os campos
        setValores(data)
      } else {
        // Posicional - precisa parsear via API
        const response = await layoutApi.parsearRegistro({
          idRegistro: selectedRegistro.id,
          registro: data,
        })
        setValores(response.valores)
      }
    } catch (err) {
      setError('Erro ao carregar: ' + (err.response?.data?.erro || err.message))
    } finally {
      setLoading(false)
    }
  }

  // Gerar output
  const handleGenerate = async (outputType) => {
    setError('')
    setLoading(true)

    try {
      if (outputType === 'json') {
        // JSON - só formata os valores atuais
        setOutput(JSON.stringify(valores, null, 2))
      } else {
        // Posicional - precisa gerar via API
        const response = await layoutApi.gerarRegistro({
          idRegistro: selectedRegistro.id,
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

  const registros = selectedLayout?.registros || []
  const campos = selectedRegistro?.campos || []

  // Calculate active step for visual feedback
  const getActiveStep = () => {
    if (!selectedLayout) return 0
    if (!selectedRegistro) return 1
    if (Object.keys(valores).length === 0) return 2
    return 3
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            mb: 0.5,
          }}
        >
          Conversor de Registros
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Converta registros entre JSON e formato posicional
        </Typography>
      </Box>

      {/* Progress Steps */}
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <CardContent sx={{ py: 2 }}>
          <Stepper activeStep={getActiveStep()} alternativeLabel>
            <Step completed={!!selectedLayout}>
              <StepLabel>Selecionar Layout</StepLabel>
            </Step>
            <Step completed={!!selectedRegistro}>
              <StepLabel>Selecionar Registro</StepLabel>
            </Step>
            <Step completed={Object.keys(valores).length > 0}>
              <StepLabel>Carregar/Editar</StepLabel>
            </Step>
            <Step completed={!!output}>
              <StepLabel>Gerar Saida</StepLabel>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      <Fade in={!!error}>
        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
        </Box>
      </Fade>

      <Grid container spacing={3}>
        {/* Seletores */}
        <Grid item xs={12}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }} elevation={0}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Configuracao
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <LayoutSelector
                    layouts={layouts}
                    selectedLayout={selectedLayout}
                    onSelect={handleLayoutSelect}
                    loading={loadingLayouts}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <RegistroSelector
                    registros={registros}
                    selectedRegistro={selectedRegistro}
                    onSelect={handleRegistroSelect}
                    disabled={!selectedLayout}
                  />
                </Grid>
              </Grid>
              {selectedRegistro && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${campos.length} campos`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {selectedRegistro.codigo && (
                    <Chip
                      label={`Codigo: ${selectedRegistro.codigo}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Input/Output em 2 colunas */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
            elevation={0}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    backgroundColor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TransformIcon sx={{ fontSize: 18, color: 'white' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Entrada
                </Typography>
              </Box>
              <InputArea
                onLoad={handleLoad}
                disabled={!selectedRegistro}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
            elevation={0}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    backgroundColor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TransformIcon sx={{ fontSize: 18, color: 'white', transform: 'rotate(180deg)' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Saida
                </Typography>
              </Box>
              <OutputArea
                onGenerate={handleGenerate}
                output={output}
                loading={loading}
                disabled={!selectedRegistro || Object.keys(valores).length === 0}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Editor de campos */}
        <Grid item xs={12}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }} elevation={0}>
            <CardContent>
              <FieldEditor
                campos={campos}
                valores={valores}
                onChange={setValores}
                disabled={!selectedRegistro}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ConverterPage
