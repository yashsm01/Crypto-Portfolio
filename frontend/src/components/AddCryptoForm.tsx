import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { TextField, Button, Box, Paper } from '@mui/material';
import { addPortfolioEntry } from '../store/portfolioSlice';
import type { AppDispatch } from '../store/store';
import { AlertMessage } from './AlertMessage';

export const AddCryptoForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !quantity) {
      setError('Please fill in all fields');
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Please enter a valid quantity greater than 0');
      return;
    }

    try {
      await dispatch(addPortfolioEntry({
        symbol: symbol.toUpperCase(),
        quantity: quantityNum,
      })).unwrap();
      
      // Reset form
      setSymbol('');
      setQuantity('');
    } catch (error) {
      setError('Failed to add cryptocurrency. Please try again.');
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setQuantity(value);
    }
  };

  return (
    <>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center'
        }}>
          <TextField
            label="Crypto Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="e.g., BTC"
            required
            sx={{ flexGrow: 1 }}
          />
          <TextField
            label="Quantity"
            type="text"
            value={quantity}
            onChange={handleQuantityChange}
            placeholder="e.g., 0.12345678"
            required
            inputProps={{ 
              pattern: "^\\d*\\.?\\d*$",
              inputMode: "decimal",
              step: "any",
              min: "0"
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            sx={{ 
              height: '56px',
              minWidth: '120px'
            }}
          >
            Add Crypto
          </Button>
        </Box>
      </Paper>
      <AlertMessage 
        message={error}
        onClose={() => setError(null)}
      />
    </>
  );
}; 