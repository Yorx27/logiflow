import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

const SOCKET_URL = import.meta.env.VITE_API_URL || '/'

export function getSocket(accessToken?: string): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token: accessToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
    })
  }
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
