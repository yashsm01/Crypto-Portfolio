import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Snackbar,
  CircularProgress
} from "@mui/material";
import { api } from "../services/api";

export const KafkaTest = () => {
  const [symbol, setSymbol] = useState('BTC');
  const [newPrice, setNewPrice] = useState('50000');
  const [userId, setUserId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (isSignificant: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = isSignificant 
        ? '/kafka-test/trigger-significant-change'
        : '/kafka-test/trigger-price-update';

      const response = await api.post(endpoint, {
        symbol,
        newPrice: parseFloat(newPrice),
        userId: parseInt(userId),
      });

      setSuccess(`Successfully triggered ${isSignificant ? 'significant ' : ''}price change: ${response.data.details.percentageChange.toFixed(2)}%`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to trigger price update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        Test Kafka Price Updates
      </Typography>

      <Box component="form" sx={{ '& > :not(style)': { m: 1 } }}>
        <TextField
          label="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          fullWidth
        />
        <TextField
          label="New Price"
          type="number"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          fullWidth
        />
        <TextField
          label="User ID"
          type="number"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          fullWidth
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Trigger Price Update'}
          </Button>

          <Button
            variant="contained"
            color="warning"
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Trigger Significant Change'}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Paper>
  );
};