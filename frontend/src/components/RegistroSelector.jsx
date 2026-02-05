import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

function RegistroSelector({ registros, selectedRegistro, onSelect, disabled }) {
  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel>Registro</InputLabel>
      <Select
        value={selectedRegistro?.id || ''}
        label="Registro"
        onChange={(e) => {
          const registro = registros.find(r => r.id === e.target.value)
          onSelect(registro)
        }}
      >
        {registros.map((registro) => (
          <MenuItem key={registro.id} value={registro.id}>
            {registro.nome} {registro.codigo && `(${registro.codigo})`}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default RegistroSelector
