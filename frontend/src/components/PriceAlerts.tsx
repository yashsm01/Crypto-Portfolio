import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { websocketService } from '../services/websocket.service';

interface PriceUpdate {
  symbol: string;
  oldPrice: string | number;
  newPrice: string | number;
  percentageChange: number;
  userId: number;
}

const formatPrice = (price: string | number): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return numPrice.toFixed(2);
};

export const PriceAlerts = () => {
  const [priceAlert, setPriceAlert] = useState<PriceUpdate | null>(null);
  const [significantAlert, setSignificantAlert] = useState<PriceUpdate | null>(null);

  useEffect(() => {
    // Subscribe to regular price updates
    websocketService.subscribeToUpdates((data: PriceUpdate) => {
      console.log('Processing price update:', data);
      setPriceAlert(data);
    });

    // Subscribe to significant price changes
    websocketService.subscribeToSignificantChanges((data: PriceUpdate) => {
      console.log('Processing significant price change:', data);
      setSignificantAlert(data);
    });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  const handleCloseAlert = () => {
    setPriceAlert(null);
  };

  const handleCloseSignificantAlert = () => {
    setSignificantAlert(null);
  };

  return (
    <>
      {/* Regular price update alert */}
      <Snackbar
        open={!!priceAlert}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="info">
          {priceAlert && (
            <>
              Price update for {priceAlert.symbol}:<br />
              {formatPrice(priceAlert.oldPrice)} → {formatPrice(priceAlert.newPrice)} USD<br />
              Change: {priceAlert.percentageChange.toFixed(2)}%
            </>
          )}
        </Alert>
      </Snackbar>

      {/* Significant price change alert */}
      <Snackbar
        open={!!significantAlert}
        autoHideDuration={8000}
        onClose={handleCloseSignificantAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSignificantAlert} severity="warning">
          {significantAlert && (
            <>
              <strong>Significant price change for {significantAlert.symbol}!</strong><br />
              {formatPrice(significantAlert.oldPrice)} → {formatPrice(significantAlert.newPrice)} USD<br />
              Change: {significantAlert.percentageChange.toFixed(2)}%
            </>
          )}
        </Alert>
      </Snackbar>
    </>
  );
};