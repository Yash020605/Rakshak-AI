import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/network';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket'], autoConnect: false });
  }
  return socket;
}

export function connectSocket() {
  try {
    const s = getSocket();
    s.on('connect_error', (error) => {
      console.log('Socket connection error (non-critical):', error.message);
    });
    s.connect();
  } catch (error) {
    console.log('Socket connection failed (non-critical):', error.message);
  }
}

export function disconnectSocket() {
  socket?.disconnect();
}

export function subscribeToAlertUpdates(userId, callback) {
  const s = getSocket();
  s.on(`alert:${userId}`, callback);
  return () => s.off(`alert:${userId}`, callback);
}

export function subscribeToLocationUpdates(userId, callback) {
  const s = getSocket();
  s.on(`location:${userId}`, callback);
  return () => s.off(`location:${userId}`, callback);
}
