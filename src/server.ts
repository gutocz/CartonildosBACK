import { WebSocketServer } from 'ws';
import { MyWebSocket } from './types';
import { MessageHandler } from './websocket/MessageHandler';
import { UserManager } from './user/UserManager';
import { GameManager } from './game/GameManager';
import { GAME_RULES, MESSAGE_TYPES } from './config/constants';

const wss = new WebSocketServer({ port: 8080 });
const messageHandler = new MessageHandler();
const userManager = UserManager.getInstance();
const gameManager = GameManager.getInstance();

wss.on('connection', (ws: MyWebSocket) => {
  ws.isAlive = true;
  console.log('Cliente conectado!');

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message: Buffer) => {
    messageHandler.handle(ws, message);
  });

  ws.on('close', () => {
    userManager.handleDisconnect(ws, (disconnectedUser) => {
      console.log(`Cliente ${disconnectedUser.username} desconectado.`);
      userManager.broadcastUserList();
      userManager.broadcast({ type: MESSAGE_TYPES.CHAT, payload: `${disconnectedUser.username} saiu da sala!` });
      
      const newLeader = userManager.getLeader();
      if (newLeader) {
          userManager.broadcast({ type: MESSAGE_TYPES.GET_LEADER_RESPONSE, payload: newLeader.username });
      }

      gameManager.handleDisconnect(disconnectedUser, userManager.broadcast.bind(userManager));
    });
  });

  ws.on('error', (error) => {
    console.error('Erro no WebSocket:', error);
  });
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const myWs = ws as MyWebSocket;
    if (!myWs.isAlive) {
      return myWs.terminate();
    }
    myWs.isAlive = false;
    myWs.ping();
  });
}, GAME_RULES.HEARTBEAT_INTERVAL);

wss.on('close', () => {
  clearInterval(interval);
});

console.log('Servidor WebSocket iniciado na porta 8080');