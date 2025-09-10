import { HashRouter as Router, Routes, Route } from 'react-router';
import { Box, ThemeProvider, CssBaseline, IconButton, Tooltip } from '@mui/material';
import { LightMode, DarkMode, Refresh, Reply as ReplyIcon } from '@mui/icons-material';
import { ProcessListPage } from './pages/ProcessListPage';
import { ProcessOverviewPage } from './pages/ProcessOverviewPage';
import { lightTheme, darkTheme } from './utils/theme';
import { DatabaseProvider, useDatabaseContext } from './contexts/DatabaseContext';
import { ReplyModal } from './components/modals/ReplyModal';
import type { EmailMsg } from './utils/db';
import { useState } from 'react';

const _Routes = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<ProcessListPage />} />
        <Route path='/:id' element={<ProcessOverviewPage />} />
      </Routes>
    </Router>
  );
};

const FixedButtons = ({
  toggleTheme,
  useLightTheme,
}: {
  toggleTheme: () => void;
  useLightTheme: boolean;
}) => {
  const { resetToDemo, store, updateStore } = useDatabaseContext();
  const [showReplyModal, setShowReplyModal] = useState<boolean>(false);

  function handleSendFirmReply(
    conversationId: string,
    message: string,
    toEmail?: string,
    fromEmail?: string,
  ) {
    if (!store) return;

    const selectedConvo = store.convos[conversationId];
    if (!selectedConvo) return;

    const newMessage: EmailMsg = {
      id: `m_${Date.now()}`,
      ts: new Date().toISOString(),
      from: fromEmail || 'Generic Firm <firm@example.com>',
      fromRole: 'ADMIN',
      to: [toEmail || selectedConvo.aliasEmail],
      direction: 'IN',
      body: message,
    };

    // Update the conversation
    const updatedConvo = {
      ...selectedConvo,
      messages: [...selectedConvo.messages, newMessage],
      lastActivityAt: new Date().toISOString(),
      messageCount: selectedConvo.messageCount + 1,
    };

    const updatedStore = {
      ...store,
      convos: {
        ...store.convos,
        [conversationId]: updatedConvo,
      },
    };

    updateStore(updatedStore);
  }

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

      {/* Reply as firm button */}
      <Tooltip title='Reply as firm' placement='right'>
        <IconButton
          onClick={() => setShowReplyModal(true)}
          sx={{
            position: 'fixed',
            top: 124,
            left: 16,
            zIndex: 9998, // Slightly lower than other buttons
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&:focus': {
              bgcolor: 'primary.dark',
            },
          }}
          aria-label='Send firm reply'
        >
          <ReplyIcon />
        </IconButton>
      </Tooltip>

      {/* Reply Modal */}
      <ReplyModal
        open={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        store={store}
        onSendReply={handleSendFirmReply}
      />
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
