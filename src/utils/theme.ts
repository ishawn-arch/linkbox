import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f9fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#213547',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.2rem',
      lineHeight: 1.1,
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      lineHeight: 1.5,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontSynthesis: 'none',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '#root': {
          margin: 0,
          display: 'flex',
          minWidth: '320px',
          width: '100%',
        },
        a: {
          fontWeight: 500,
          color: '#646cff',
          textDecoration: 'inherit',
          '&:hover': {
            color: '#747bff',
          },
        },
        // Custom scrollbar styles for light theme
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '8px',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 500,
          padding: '0.6em 1.2em',
          transition: 'border-color 0.25s',
          '&:focus, &:focus-visible': {
            outline: '4px auto -webkit-focus-ring-color',
          },
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.2rem',
      lineHeight: 1.1,
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      lineHeight: 1.5,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontSynthesis: 'none',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '#root': {
          margin: 0,
          display: 'flex',
          minWidth: '320px',
          width: '100%',
        },
        a: {
          fontWeight: 500,
          color: '#8bb6ff',
          textDecoration: 'inherit',
          '&:hover': {
            color: '#a5c9ff',
          },
        },
        // Custom scrollbar styles for dark theme
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 500,
          padding: '0.6em 1.2em',
          transition: 'border-color 0.25s',
          '&:focus, &:focus-visible': {
            outline: '4px auto -webkit-focus-ring-color',
          },
        },
      },
    },
  },
});
