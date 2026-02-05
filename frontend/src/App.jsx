import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  alpha,
} from '@mui/material'
import ViewListIcon from '@mui/icons-material/ViewList'
import TransformIcon from '@mui/icons-material/Transform'
import ConverterPage from './pages/ConverterPage'
import LayoutsPage from './pages/LayoutsPage'

function Navigation() {
  const location = useLocation()
  const currentTab = location.pathname === '/layouts' ? 1 : 0

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
            }}
          >
            <ViewListIcon />
          </Box>
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Layout Generator
            </Typography>
            <Typography
              variant="caption"
              sx={{
                opacity: 0.8,
                letterSpacing: '0.02em',
              }}
            >
              Gerador de registros posicionais
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }} />

        <Tabs
          value={currentTab}
          textColor="inherit"
          TabIndicatorProps={{
            sx: {
              backgroundColor: '#fff',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.7)',
              minHeight: 56,
              px: 3,
            },
            '& .Mui-selected': {
              color: '#fff',
            },
          }}
        >
          <Tab
            icon={<TransformIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Conversor"
            component={Link}
            to="/"
          />
          <Tab
            icon={<ViewListIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Layouts"
            component={Link}
            to="/layouts"
          />
        </Tabs>
      </Toolbar>
    </AppBar>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navigation />
        <Box
          component="main"
          sx={{
            flex: 1,
            py: 4,
            px: 2,
          }}
        >
          <Container maxWidth="lg">
            <Routes>
              <Route path="/" element={<ConverterPage />} />
              <Route path="/layouts" element={<LayoutsPage />} />
            </Routes>
          </Container>
        </Box>
      </Box>
    </BrowserRouter>
  )
}

export default App
