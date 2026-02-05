import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
  CircularProgress,
  Alert,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CodeIcon from '@mui/icons-material/Code'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import CheckIcon from '@mui/icons-material/Check'

function OutputArea({ onGenerate, output, loading, disabled }) {
  const [outputType, setOutputType] = useState('posicional')
  const [snackbar, setSnackbar] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    onGenerate(outputType)
  }

  const handleCopy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setSnackbar(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getDisplayOutput = () => {
    if (!output) return ''
    if (outputType === 'json') {
      return typeof output === 'string' ? output : JSON.stringify(output, null, 2)
    }
    return output
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ToggleButtonGroup
          value={outputType}
          exclusive
          onChange={(e, value) => value && setOutputType(value)}
          size="small"
        >
          <ToggleButton value="json">
            <CodeIcon sx={{ fontSize: 18, mr: 0.5 }} />
            JSON
          </ToggleButton>
          <ToggleButton value="posicional">
            <ViewColumnIcon sx={{ fontSize: 18, mr: 0.5 }} />
            Posicional
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={4}
        value={getDisplayOutput()}
        placeholder="O resultado aparecera aqui..."
        InputProps={{
          readOnly: true,
          sx: { fontFamily: 'monospace' },
        }}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            backgroundColor: output ? 'success.50' : 'grey.50',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          },
        }}
      />

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={disabled || loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
          color="success"
          sx={{
            px: 3,
            background: disabled ? undefined : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          }}
        >
          {loading ? 'Gerando...' : 'Gerar'}
        </Button>
        <Button
          variant="outlined"
          onClick={handleCopy}
          disabled={!output}
          startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
          color={copied ? 'success' : 'primary'}
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </Button>
      </Box>

      <Snackbar
        open={snackbar}
        autoHideDuration={2000}
        onClose={() => setSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Copiado para a area de transferencia!
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default OutputArea
