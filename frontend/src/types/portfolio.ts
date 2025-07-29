export interface PortfolioEntry {
  id: number;
  symbol: string;
  quantity: string;
  currentPrice: number | null;
  totalValue: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePortfolioEntry {
  symbol: string;
  quantity: number;
}

export interface PortfolioState {
  entries: PortfolioEntry[];
  loading: boolean;
  error: string | null;
} 