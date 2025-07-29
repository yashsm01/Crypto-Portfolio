import { Alert, Snackbar } from '@mui/material';

interface AlertMessageProps {
  message: string | null;
  severity?: 'error' | 'warning' | 'info' | 'success';
  onClose: () => void;
}

export const AlertMessage = ({ message, severity = 'error', onClose }: AlertMessageProps) => {
  return (
    <Snackbar
      open={!!message}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity}
        variant="filled"
        elevation={6}
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}; 