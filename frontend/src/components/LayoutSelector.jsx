import { FormControl, InputLabel, Select, MenuItem, CircularProgress, Box } from '@mui/material'

function LayoutSelector({ layouts, selectedLayout, onSelect, loading }) {
  return (
    <FormControl fullWidth>
      <InputLabel>Layout</InputLabel>
      <Select
        value={selectedLayout?.id || ''}
        label="Layout"
        onChange={(e) => {
          const layout = layouts.find(l => l.id === e.target.value)
          onSelect(layout)
        }}
        disabled={loading}
      >
        {loading ? (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              Carregando...
            </Box>
          </MenuItem>
        ) : (
          layouts.map((layout) => (
            <MenuItem key={layout.id} value={layout.id}>
              {layout.nome}
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  )
}

export default LayoutSelector
