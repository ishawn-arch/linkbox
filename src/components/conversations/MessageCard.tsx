import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type { EmailMsg } from '../../utils/db';
import { fmtDateTime } from '../../utils/db';

export interface MessageCardProps {
  msg: EmailMsg;
}

export const MessageCard = ({ msg }: MessageCardProps) => {
  const isOut = msg.direction === 'OUT';

  return (
    <Card
      variant='outlined'
      sx={{
        backgroundColor: 'action.hover',
        width: '90%',
        alignSelf: isOut ? 'flex-end' : 'flex-start',
      }}
    >
      <CardContent sx={{ py: 2 }}>
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='flex-start'
          sx={{ mb: 1 }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant='caption' color='text.secondary'>
              <Typography component='span' variant='caption' fontWeight={600}>
                {msg.from}
              </Typography>
              {' → '}
              <Typography component='span' variant='caption'>
                {msg.to.join(', ')}
              </Typography>
            </Typography>
          </Box>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ ml: 2, flexShrink: 0 }}
          >
            {fmtDateTime(msg.ts)}
          </Typography>
        </Stack>
        <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {msg.body}
        </Typography>
      </CardContent>
    </Card>
  );
};
