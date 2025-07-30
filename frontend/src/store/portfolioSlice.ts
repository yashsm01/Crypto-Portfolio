import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import type { PortfolioEntry, CreatePortfolioEntry, PortfolioState } from '../types/portfolio';
import { api } from './authSlice';

const handleError = (error: any): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message;
  }
  return 'An unexpected error occurred';
};

export const fetchPortfolio = createAsyncThunk<PortfolioEntry[], void>(
  'portfolio/fetchPortfolio',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<PortfolioEntry[]>('/portfolio');
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const addPortfolioEntry = createAsyncThunk<PortfolioEntry, CreatePortfolioEntry>(
  'portfolio/addEntry',
  async (entry: CreatePortfolioEntry, { rejectWithValue }) => {
    try {
      const response = await api.post<PortfolioEntry>('/portfolio', {
        ...entry,
        quantity: entry.quantity.toFixed(8),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const deletePortfolioEntry = createAsyncThunk<number, number>(
  'portfolio/deleteEntry',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/portfolio/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

const initialState: PortfolioState = {
  entries: [],
  loading: false,
  error: null,
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Portfolio
      .addCase(fetchPortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
        state.error = null;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch portfolio data';
      })
      // Add Entry
      .addCase(addPortfolioEntry.pending, (state) => {
        state.error = null;
      })
      .addCase(addPortfolioEntry.fulfilled, (state, action) => {
        console.log('addPortfolioEntry.fulfilled', action.payload);
        state.entries.push(action.payload);
        state.error = null;
      })
      .addCase(addPortfolioEntry.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to add portfolio entry';
      })
      // Delete Entry
      .addCase(deletePortfolioEntry.pending, (state) => {
        state.error = null;
      })
      .addCase(deletePortfolioEntry.fulfilled, (state, action) => {
        state.entries = state.entries.filter(entry => entry.id !== action.payload);
        state.error = null;
      })
      .addCase(deletePortfolioEntry.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to delete portfolio entry';
      })
      // Handle logout
      .addCase('RESET_STATE', () => initialState);
  },
});

export const { clearError } = portfolioSlice.actions;
export default portfolioSlice.reducer; 