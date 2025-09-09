import { BrowserRouter, Routes, Route } from 'react-router';
import { Box, ThemeProvider, CssBaseline, IconButton, Tooltip } from '@mui/material';
import { LightMode, DarkMode, Refresh } from '@mui/icons-material';
import { ProcessListPage } from './pages/ProcessListPage';
import { ProcessOverviewPage } from './pages/ProcessOverviewPage';
import { lightTheme, darkTheme } from './utils/theme';
import { DatabaseProvider, useDatabaseContext } from './contexts/DatabaseContext';
import { useState } from 'react';

const _Routes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<ProcessListPage />} />
        <Route path='/:id' element={<ProcessOverviewPage />} />
      </Routes>
    </BrowserRouter>
  );
};

const FixedButtons = ({
  toggleTheme,
  useLightTheme,
}: {
  toggleTheme: () => void;
  useLightTheme: boolean;
}) => {
  const { resetToDemo } = useDatabaseContext();

  return (
    <>
      {/* Reset data button */}
      <Tooltip title='Reset demo' placement='right'>
        <IconButton
          onClick={resetToDemo}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 9999,
            bgcolor: 'warning.main',
            color: 'white',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'warning.dark',
            },
          }}
          aria-label='Reset to demo data'
        >
          <Refresh />
        </IconButton>
      </Tooltip>

      {/* Theme toggle button */}
      <Tooltip
        title={useLightTheme ? 'Switch to dark theme' : 'Switch to light theme'}
        placement='right'
      >
        <IconButton
          onClick={toggleTheme}
          sx={{
            position: 'fixed',
            top: 70,
            left: 16,
            zIndex: 9999,
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          aria-label='Toggle theme'
        >
          {useLightTheme ? <DarkMode /> : <LightMode />}
        </IconButton>
      </Tooltip>
    </>
  );
};

export const App = () => {
  const [useLightTheme, setUseLightTheme] = useState(false);
  const theme = useLightTheme ? lightTheme : darkTheme;

  const toggleTheme = () => {
    setUseLightTheme(!useLightTheme);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <DatabaseProvider>
        <FixedButtons toggleTheme={toggleTheme} useLightTheme={useLightTheme} />

        <Box sx={{ padding: 2, margin: '0 auto', width: '100%' }}>
          <_Routes />
        </Box>
      </DatabaseProvider>
    </ThemeProvider>
  );
};
