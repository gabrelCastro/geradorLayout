import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const layoutApi = {
  // --- CRUD de Layouts ---

  // Criar layout
  criarLayout: async (layoutDto) => {
    const response = await api.post('/layouts', layoutDto)
    return response.data
  },

  // Buscar todos os layouts
  getLayouts: async () => {
    const response = await api.get('/layouts')
    return response.data
  },

  // Buscar layout por ID
  getLayoutById: async (id) => {
    const response = await api.get(`/layouts/${id}`)
    return response.data
  },

  // Buscar layout por nome
  getLayoutByNome: async (nome) => {
    const response = await api.get(`/layouts/nome/${encodeURIComponent(nome)}`)
    return response.data
  },

  // Atualizar layout
  atualizarLayout: async (id, layoutDto) => {
    const response = await api.put(`/layouts/${id}`, layoutDto)
    return response.data
  },

  // Deletar layout
  deletarLayout: async (id) => {
    await api.delete(`/layouts/${id}`)
  },

  // --- Gerar/Parsear Registros ---

  // Gerar registro posicional
  gerarRegistro: async (request) => {
    const response = await api.post('/layouts/gerar-registro', request)
    return response.data
  },

  // Parsear registro posicional para JSON
  parsearRegistro: async (request) => {
    const response = await api.post('/layouts/parsear-registro', request)
    return response.data
  },

  // --- Importar PDF ---

  // Extrair layout do PDF (preview, não salva)
  extrairLayoutDoPdf: async (arquivo, nomeLayout) => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    formData.append('nomeLayout', nomeLayout)
    const response = await api.post('/layouts/importar-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // Importar e salvar layout do PDF
  importarLayoutDoPdf: async (arquivo, nomeLayout) => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    formData.append('nomeLayout', nomeLayout)
    const response = await api.post('/layouts/importar-pdf/salvar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

export default layoutApi
