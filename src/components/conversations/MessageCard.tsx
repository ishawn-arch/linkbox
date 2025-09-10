import { Box, Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import type { EmailMsg } from '../../utils/db';
import { fmtDateTime } from '../../utils/db';
import {
  getFirmEmailColor,
  isFirmEmail,
  extractEmailAddress,
} from '../../utils/messageColors';

export interface MessageCardProps {
  msg: EmailMsg;
}

export const MessageCard = ({ msg }: MessageCardProps) => {
  const isOut = msg.direction === 'OUT';
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const emailAddress = extractEmailAddress(msg.from);
  const isFromFirm = !isOut && isFirmEmail(msg.fromRole);

  // Get distinct color for firm emails based on current theme
  const firmColors = isFromFirm ? getFirmEmailColor(emailAddress, isDarkMode) : null;

  return (
    <Card
      variant='outlined'
      sx={{
        backgroundColor: firmColors ? firmColors.backgroundColor : 'action.hover',
        borderColor: firmColors ? firmColors.borderColor : 'divider',
        borderWidth: 1,
        width: '90%',
        alignSelf: isOut ? 'flex-end' : 'flex-start',
        ...(firmColors && {
          // Override text colors for firm emails
          '& .MuiTypography-root': {
            color: `${firmColors.textColor} !important`,
          },
          // Style the timestamp with slightly lower opacity
          '& .timestamp-text': {
            color: `${firmColors.textColor}CC !important`, // 80% opacity
          },
          // Style the "from → to" line with lower opacity
          '& .from-to-text': {
            color: `${firmColors.textColor}B3 !important`, // 70% opacity
          },
        }),
      }}
    >
      <CardContent sx={{ py: 2 }}>
        <Stack spacing={1} sx={{ mb: 1.5 }}>
          {/* Header with direction and timestamp */}
          <Stack direction='row' justifyContent='space-between' alignItems='center'>
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {isOut ? 'Outgoing Email' : 'Incoming Email'}
            </Typography>
            <Typography
              variant='caption'
              color='text.secondary'
              className='timestamp-text'
              sx={{ flexShrink: 0 }}
            >
              {fmtDateTime(msg.ts)}
            </Typography>
          </Stack>

          {/* From information */}
          <Box>
            <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 500 }}>
              From:
            </Typography>
            <Typography
              component='span'
              variant='body2'
              sx={{ ml: 1, fontWeight: 500 }}
              className='from-to-text'
            >
              {msg.from}
            </Typography>
          </Box>

          {/* To information */}
          <Box>
            <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 500 }}>
              To:
            </Typography>
            <Typography
              component='span'
              variant='body2'
              sx={{ ml: 1 }}
              className='from-to-text'
            >
              {msg.to.join(', ')}
            </Typography>
          </Box>

          {/* CC information */}
          {msg.cc && msg.cc.length > 0 && (
            <Box>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ fontWeight: 500 }}
              >
                CC:
              </Typography>
              <Typography
                component='span'
                variant='body2'
                sx={{ ml: 1 }}
                className='from-to-text'
              >
                {msg.cc.join(', ')}
              </Typography>
            </Box>
          )}

          {/* BCC information */}
          {msg.bcc && msg.bcc.length > 0 && (
            <Box>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ fontWeight: 500 }}
              >
                BCC:
              </Typography>
              <Typography
                component='span'
                variant='body2'
                sx={{ ml: 1 }}
                className='from-to-text'
              >
                {msg.bcc.join(', ')}
              </Typography>
            </Box>
          )}
        </Stack>
        <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {msg.body}
        </Typography>
      </CardContent>
    </Card>
  );
};
