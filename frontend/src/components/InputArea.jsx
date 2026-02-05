import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Fade,
  CircularProgress,
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CodeIcon from '@mui/icons-material/Code'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'

function InputArea({ onLoad, disabled, loading }) {
  const [inputType, setInputType] = useState('json')
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  const handleLoad = () => {
    setError('')
    if (!inputValue.trim()) {
      setError('Digite ou cole um valor')
      return
    }

    if (inputType === 'json') {
      try {
        const parsed = JSON.parse(inputValue)
        onLoad({ type: 'json', data: parsed })
      } catch (e) {
        setError('JSON invalido: ' + e.message)
      }
    } else {
      onLoad({ type: 'posicional', data: inputValue.trim() })
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ToggleButtonGroup
          value={inputType}
          exclusive
          onChange={(e, value) => value && setInputType(value)}
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
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={
          inputType === 'json'
            ? '{\n  "codigo_banco": "341",\n  "nome_empresa": "ACME"\n}'
            : '341ACME Ltda                          '
        }
        disabled={disabled}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            backgroundColor: disabled ? 'action.disabledBackground' : 'grey.50',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          },
        }}
        InputProps={{ sx: { fontFamily: 'monospace' } }}
      />

      <Fade in={!!error}>
        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
        </Box>
      </Fade>

      <Button
        variant="contained"
        onClick={handleLoad}
        disabled={disabled || loading || !inputValue.trim()}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
        sx={{
          px: 3,
          background: disabled ? undefined : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        }}
      >
        {loading ? 'Carregando...' : 'Carregar'}
      </Button>
    </Box>
  )
}

export default InputArea
