import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/constants';

// Strip /api suffix for socket connection
const SOCKET_URL = API_BASE_URL.replace('/api', '');

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket'], autoConnect: false });
  }
  return socket;
}

export function connectSocket() {
  getSocket().connect();
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
