import { io } from 'socket.io-client';
let socket = null;
export function getSocket(accessToken) {
    if (!socket) {
        socket = io('/', {
            path: '/socket.io',
            auth: { token: accessToken },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: Infinity,
        });
    }
    return socket;
}
export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}
