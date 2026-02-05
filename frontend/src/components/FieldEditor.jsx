import { Box, TextField, Chip, Typography, Grid, InputAdornment } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import TextFieldsIcon from '@mui/icons-material/TextFields'

function FieldEditor({ campos, valores, onChange, disabled }) {
  if (!campos || campos.length === 0) {
    return (
      <Box
        sx={{
          py: 6,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 2,
            backgroundColor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <TextFieldsIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
        </Box>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Nenhum campo disponivel
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Selecione um layout e registro para ver e editar os campos
        </Typography>
      </Box>
    )
  }

  const handleChange = (nomeCampo, value) => {
    onChange({
      ...valores,
      [nomeCampo]: value,
    })
  }

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'NUMERICO':
        return 'primary'
      case 'ALFANUMERICO':
        return 'default'
      case 'DECIMAL':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getPreenchimentoLabel = (preenchimento) => {
    switch (preenchimento) {
      case 'ZERO_ESQUERDA':
        return '0←'
      case 'ESPACO_DIREITA':
        return '→ '
      case 'ESPACO_ESQUERDA':
        return ' ←'
      default:
        return preenchimento
    }
  }

  // Ordenar por posição
  const camposOrdenados = [...campos].sort((a, b) => a.posicaoInicial - b.posicaoInicial)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            backgroundColor: 'warning.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <EditIcon sx={{ fontSize: 18, color: 'white' }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={600}>
          Editor de Campos
        </Typography>
        <Chip
          label={`${campos.length} campos`}
          size="small"
          variant="outlined"
          sx={{ ml: 1 }}
        />
      </Box>

      <Grid container spacing={2}>
        {camposOrdenados.map((campo, index) => {
          const tamanho = campo.posicaoFinal - campo.posicaoInicial + 1

          return (
            <Grid item xs={12} sm={6} md={4} key={campo.nome}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: valores[campo.nome] ? 'primary.light' : 'divider',
                  backgroundColor: valores[campo.nome] ? 'rgba(99, 102, 241, 0.04)' : 'background.paper',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip
                    label={`${campo.posicaoInicial}-${campo.posicaoFinal}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace', fontWeight: 500 }}
                  />
                  <Chip
                    label={campo.tipo}
                    size="small"
                    color={getTipoColor(campo.tipo)}
                    variant="outlined"
                  />
                  <Chip
                    label={getPreenchimentoLabel(campo.preenchimento)}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace' }}
                  />
                  {campo.obrigatorio && (
                    <Typography
                      component="span"
                      sx={{ color: 'error.main', fontWeight: 600, fontSize: '1rem' }}
                    >
                      *
                    </Typography>
                  )}
                </Box>
                <TextField
                  fullWidth
                  label={campo.nome}
                  value={valores[campo.nome] || ''}
                  onChange={(e) => handleChange(campo.nome, e.target.value)}
                  disabled={disabled}
                  placeholder={campo.valorDefault || `Tamanho: ${tamanho}`}
                  InputProps={{
                    sx: { fontFamily: 'monospace' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {tamanho}
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'background.paper',
                    },
                  }}
                />
              </Box>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

export default FieldEditor
