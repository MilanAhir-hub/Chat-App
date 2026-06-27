// Track global online users connection count (supports multiple tabs per user)
const userConnections = new Map<string, Set<string>>();

export const userStatusTracker = {
  addConnection(userId: string, socketId: string): boolean {
    let sockets = userConnections.get(userId);
    if (!sockets) {
      sockets = new Set();
      userConnections.set(userId, sockets);
    }
    const wasOffline = sockets.size === 0;
    sockets.add(socketId);
    return wasOffline; // Returns true if this is the first connection (user goes online)
  },

  removeConnection(userId: string, socketId: string): boolean {
    const sockets = userConnections.get(userId);
    if (!sockets) return false;
    
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userConnections.delete(userId);
      return true; // Returns true if last connection removed (user goes offline)
    }
    return false;
  },

  isOnline(userId: string): boolean {
    const sockets = userConnections.get(userId);
    return Boolean(sockets && sockets.size > 0);
  },

  getOnlineUsers(): string[] {
    return Array.from(userConnections.keys());
  }
};
