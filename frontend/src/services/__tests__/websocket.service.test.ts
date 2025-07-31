import { websocketService } from '../websocket.service';

describe('WebSocketService', () => {
  const mockToken = 'test-token';

  beforeEach(() => {
    // Reset the service before each test
    websocketService.disconnect();
  });

  it('should handle price updates', (done) => {
    const mockPriceUpdate = {
      symbol: 'BTC',
      oldPrice: 50000,
      newPrice: 55000,
      percentageChange: 10,
      userId: 1,
      timestamp: new Date().toISOString(),
      isSignificant: true
    };

    // Subscribe to price updates
    websocketService.onPriceUpdate((data) => {
      expect(data).toEqual(mockPriceUpdate);
      done();
    });

    // Connect and simulate receiving data
    websocketService.connect(mockToken);
    
    // Simulate WebSocket message
    const socket = (websocketService as any).socket;
    socket.emit('priceUpdate', mockPriceUpdate);
  });

  it('should handle significant changes', (done) => {
    const mockSignificantChange = {
      symbol: 'ETH',
      oldPrice: 3000,
      newPrice: 3300,
      percentageChange: 10,
      userId: 1,
      timestamp: new Date().toISOString(),
      isSignificant: true
    };

    // Subscribe to significant changes
    websocketService.onSignificantChange((data) => {
      expect(data).toEqual(mockSignificantChange);
      done();
    });

    // Connect and simulate receiving data
    websocketService.connect(mockToken);
    
    // Simulate WebSocket message
    const socket = (websocketService as any).socket;
    socket.emit('significantPriceChange', mockSignificantChange);
  });
});