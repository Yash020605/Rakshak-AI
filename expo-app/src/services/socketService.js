import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket'], autoConnect: false });
  }
  return socket;
}

export function connectSocket() { getSocket().connect(); }
export function disconnectSocket() { socket?.disconnect(); }

export function subscribeToAlertUpdates(userId, callback) {
  const s = getSocket();
  s.on(`alert:${userId}`, callback);
  return () => s.off(`alert:${userId}`, callback);
}
