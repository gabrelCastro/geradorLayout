import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RegistroTestDialog from './RegistroTestDialog'

function LayoutViewDialog({ open, onClose, layout }) {
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [selectedRegistro, setSelectedRegistro] = useState(null)

  const handleTest = (registro, e) => {
    e.stopPropagation()
    setSelectedRegistro(registro)
    setTestDialogOpen(true)
  }

  if (!layout) return null

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">{layout.nome}</Typography>
            <Chip label={`ID: ${layout.id}`} size="small" variant="outlined" />
          </Box>
        </DialogTitle>
        <DialogContent>
          {layout.descricao && (
            <Typography color="text.secondary" gutterBottom>
              {layout.descricao}
            </Typography>
          )}

          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
            Registros ({layout.registros?.length || 0})
          </Typography>

          {layout.registros?.map((registro, index) => (
            <Accordion key={index} defaultExpanded={layout.registros.length === 1}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <Typography>{registro.nome}</Typography>
                  {registro.codigo && (
                    <Chip label={registro.codigo} size="small" variant="outlined" />
                  )}
                  <Chip
                    label={`${registro.campos?.length || 0} campo(s)`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Tooltip title="Testar registro">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={(e) => handleTest(registro, e)}
                    sx={{ mr: 1 }}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                </Tooltip>
              </AccordionSummary>
              <AccordionDetails>
                {registro.descricao && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {registro.descricao}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    onClick={(e) => handleTest(registro, e)}
                  >
                    Testar Registro
                  </Button>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Pos.</TableCell>
                        <TableCell>Nome</TableCell>
                        <TableCell>Tam.</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Preenchimento</TableCell>
                        <TableCell>Obrig.</TableCell>
                        <TableCell>Default</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {registro.campos
                        ?.slice()
                        .sort((a, b) => a.posicaoInicial - b.posicaoInicial)
                        .map((campo, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              {campo.posicaoInicial}-{campo.posicaoFinal}
                            </TableCell>
                            <TableCell>{campo.nome}</TableCell>
                            <TableCell>
                              {campo.posicaoFinal - campo.posicaoInicial + 1}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={campo.tipo}
                                size="small"
                                color={
                                  campo.tipo === 'NUMERICO'
                                    ? 'primary'
                                    : campo.tipo === 'DECIMAL'
                                    ? 'secondary'
                                    : 'default'
                                }
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {campo.preenchimento}
                              </Typography>
                            </TableCell>
                            <TableCell>{campo.obrigatorio ? 'Sim' : 'Nao'}</TableCell>
                            <TableCell>
                              {campo.valorDefault || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}

          {(!layout.registros || layout.registros.length === 0) && (
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              Nenhum registro
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <RegistroTestDialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        registro={selectedRegistro}
      />
    </>
  )
}

export default LayoutViewDialog
