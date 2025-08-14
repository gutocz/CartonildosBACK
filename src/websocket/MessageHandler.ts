import { MyWebSocket, WebSocketMessage } from '../types';
import { MESSAGE_TYPES } from '../config/constants';
import { UserManager } from '../user/UserManager';
import { GameManager } from '../game/GameManager';

export class MessageHandler {
  private userManager: UserManager;
  private gameManager: GameManager;

  constructor() {
    this.userManager = UserManager.getInstance();
    this.gameManager = GameManager.getInstance();
  }

  public handle(ws: MyWebSocket, message: Buffer): void {
    try {
      const data: WebSocketMessage = JSON.parse(message.toString());
      this.routeMessage(ws, data);
    } catch (err) {
      console.error('Error parsing JSON message:', err);
      ws.send(JSON.stringify({ type: MESSAGE_TYPES.ERROR, payload: 'Invalid message format.' }));
    }
  }

  private routeMessage(ws: MyWebSocket, data: WebSocketMessage): void {
    try {
        switch (data.type) {
            case MESSAGE_TYPES.JOIN_ROOM:
                this.handleJoinRoom(ws, data.payload);
                break;
            case MESSAGE_TYPES.CHAT:
                this.handleChat(ws, data.payload);
                break;
            case MESSAGE_TYPES.GET_MY_USER:
                this.handleGetUser(ws);
                break;
            case MESSAGE_TYPES.GET_LEADER:
                this.handleGetLeader(ws);
                break;
            case MESSAGE_TYPES.START_GAME:
                this.handleStartGame(ws);
                break;
            case MESSAGE_TYPES.RESTART_GAME:
                 this.handleRestartGame();
                 break;
            case MESSAGE_TYPES.ADD_CARD_TO_TABLE:
                this.handleAddCardToTable(ws, data.payload);
                break;
            case MESSAGE_TYPES.REVEAL_CARD:
                this.handleRevealCard(data.payload);
                break;
            case MESSAGE_TYPES.CHOOSE_WINNER:
                this.handleChooseWinner(data.payload);
                break;
            default:
                ws.send(JSON.stringify({ type: MESSAGE_TYPES.ERROR, payload: 'Unknown message type.' }));
        }
    } catch (error: any) {
        ws.send(JSON.stringify({ type: MESSAGE_TYPES.ERROR, payload: error.message }));
    }
  }
  
  private handleJoinRoom(ws: MyWebSocket, username: string): void {
    const newUser = this.userManager.joinRoom(username, ws);
    const userList = this.userManager.getAllUsers().map(user => ({
        username: user.username,
        points: user.points,
    }));

    ws.send(JSON.stringify({ 
        type: MESSAGE_TYPES.SUCCESS_JOIN_ROOM, 
        payload: {
            user: newUser,
            userList: userList
        } 
    }));

    this.userManager.broadcastUserList();
    this.userManager.broadcast({ type: MESSAGE_TYPES.CHAT, payload: `${newUser.username} entrou na sala!` });
  }

  private handleChat(ws: MyWebSocket, payload: any): void {
    this.userManager.getAllUsers().forEach(user => {
        const userWs = this.userManager.getWebSocketByUser(user);
        if (userWs && userWs !== ws && userWs.readyState === ws.OPEN) {
            userWs.send(JSON.stringify({ type: MESSAGE_TYPES.CHAT, payload }));
        }
    });
  }

  private handleGetUser(ws: MyWebSocket): void {
      const user = this.userManager.findUserByWs(ws);
      if (user) {
          this.userManager.updateUser(user);
      }
  }

  private handleGetLeader(ws: MyWebSocket): void {
      const leader = this.userManager.getLeader();
      ws.send(JSON.stringify({ type: MESSAGE_TYPES.GET_LEADER_RESPONSE, payload: leader?.username ?? "" }));
  }

  private handleStartGame(ws: MyWebSocket): void {
    const user = this.userManager.findUserByWs(ws);
    const leader = this.userManager.getLeader();
    if (user?.username !== leader?.username) {
        throw new Error('Apenas o líder da sala pode iniciar o jogo.');
    }
    this.gameManager.startGame(new Map(this.userManager.getAllUsers().map(u => [u, this.userManager.getWebSocketByUser(u)])), this.userManager.broadcast.bind(this.userManager));
    this.userManager.broadcastUserList();
    this.userManager.broadcast({
        type: MESSAGE_TYPES.START_GAME_RESPONSE,
        payload: { roundMaster: this.gameManager.roundMaster?.username, question: this.gameManager.question }
    });
  }

  private handleRestartGame(): void {
      this.gameManager.restartGame(
        new Map(this.userManager.getAllUsers().map(u => [u, this.userManager.getWebSocketByUser(u)])),
        this.userManager.broadcast.bind(this.userManager),
        this.userManager.updateUser.bind(this.userManager)
      );
      this.userManager.broadcastUserList();
  }
  
  private handleAddCardToTable(ws: MyWebSocket, payload: { owner: string; cardContent: string }): void {
    const user = this.userManager.findUserByUsername(payload.owner);
    if (user) {
        this.gameManager.addCardToTable(user, payload.cardContent, this.userManager.broadcast.bind(this.userManager));
        this.userManager.updateUser(user);
    }
  }
  
  private handleRevealCard(payload: { owner: string }): void {
      this.gameManager.revealCard(payload.owner, this.userManager.broadcast.bind(this.userManager));
  }
  
  private handleChooseWinner(payload: { winnerUsername: string }): void {
      const allUsersMap = new Map(this.userManager.getAllUsers().map(u => [u, this.userManager.getWebSocketByUser(u)]));
      this.gameManager.chooseWinner(payload.winnerUsername, allUsersMap, this.userManager.broadcast.bind(this.userManager));
      this.userManager.broadcastUserList();
  }
}
