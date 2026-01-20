import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from '@mui/material';

interface WelcomePageProps {
  onInstructions: (instructionsUrl: string) => void;
}

export function WelcomePage({ onInstructions }: WelcomePageProps) {
  const [instructionsUrl, setInstructionsUrl] = useState('');

  const handleSubmit = () => {
    if (instructionsUrl.trim()) {
      onInstructions(instructionsUrl.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'grey.50',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to ChatGeneral
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter an instructions URL to get started
          </Typography>
        </Box>

        {/* Instructions URL Form */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Instructions URL"
            type="text"
            value={instructionsUrl}
            onChange={(e) => setInstructionsUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            autoFocus
            placeholder="https://example.com/instructions.md"
          />

          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={!instructionsUrl.trim()}
          >
            Continue
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
