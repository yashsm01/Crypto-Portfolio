import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { fetchPortfolio, deletePortfolioEntry } from '../store/portfolioSlice';
import type { RootState, AppDispatch } from '../store/store';
import { AlertMessage } from './AlertMessage';

// Helper function to safely format numbers with proper decimal handling
const formatCurrency = (value: number | null | undefined): string => {
  if (typeof value !== 'number') return '$0.00';
  
  // Handle different ranges of numbers
  if (value >= 1) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } else if (value >= 0.01) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(value);
  } else {
    // For very small numbers (like PEPE price)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    }).format(value);
  }
};

const formatQuantity = (value: string | number | null | undefined): string => {
  if (!value) return '0.00000000';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return numValue.toFixed(8);
};

export const PortfolioTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { entries, loading, error } = useSelector((state: RootState) => state.portfolio);
  const [refreshing, setRefreshing] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      await dispatch(fetchPortfolio()).unwrap();
    } catch (error) {
      // Error is handled by the slice
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadData();
    // Refresh data every 2 minutes
    const interval = setInterval(() => {
      loadData();
    }, 120000);

    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (error) {
      setErrorState(error);
    }
  }, [error]);

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deletePortfolioEntry(id)).unwrap();
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  if (loading && entries.length === 0) {
    return (
      <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (errorState) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          }
        >
          {errorState}. Will retry automatically.
        </Alert>
      </Paper>
    );
  }

  if (entries.length === 0 && !loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography align="center">No cryptocurrencies in your portfolio yet.</Typography>
      </Paper>
    );
  }

  const totalPortfolioValue = entries.reduce((sum, entry) => {
    const value = typeof entry.totalValue === 'number' ? entry.totalValue : 0;
    return sum + value;
  }, 0);

  return (
    <Paper elevation={3}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Your Portfolio</Typography>
        <IconButton onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
        </IconButton>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Current Price (USD)</TableCell>
              <TableCell align="right">Total Value (USD)</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell component="th" scope="row">
                  {entry.symbol}
                </TableCell>
                <TableCell align="right">{formatQuantity(entry.quantity)}</TableCell>
                <TableCell align="right">
                  {formatCurrency(entry.currentPrice)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(entry.totalValue)}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} align="right">
                <Typography variant="subtitle1" fontWeight="bold">
                  Total Portfolio Value:
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle1" fontWeight="bold">
                  {formatCurrency(totalPortfolioValue)}
                </Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <AlertMessage 
        message={errorState}
        onClose={() => setErrorState(null)}
      />
    </Paper>
  );
}; 