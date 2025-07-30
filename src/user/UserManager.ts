import { MyWebSocket, WebSocketMessage } from '../types';
import { User } from './User';
import { getRandomEmote, removeEmoji } from '../utils/emoticons';
import { getRandomHand } from '../utils/deck';
import { MESSAGE_TYPES, GAME_RULES } from '../config/constants';
import answers from '../cards/answers.json';

export class UserManager {
  private static instance: UserManager;
  private users = new Map<User, MyWebSocket>();
  private leader: User | null = null;

  private constructor() {}

  public static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  joinRoom(username: string, ws: MyWebSocket): User {
    if (!username) {
      throw new Error('O nome de usuário não pode ser vazio.');
    }
    
    const plainUsername = removeEmoji(username);
    const usernameExists = Array.from(this.users.keys()).some(
      (user) => removeEmoji(user.username) === plainUsername
    );

    if (usernameExists) {
      throw new Error('O nome de usuário já está em uso.');
    }

    const userWithEmote = `${plainUsername} ${getRandomEmote()}`;
    const newUser = new User(userWithEmote, getRandomHand(answers, GAME_RULES.CARDS_PER_HAND));
    this.users.set(newUser, ws);

    if (!this.leader) {
      this.leader = newUser;
    }
    
    return newUser;
  }
  
  handleDisconnect(ws: MyWebSocket, onDisconnect: (user: User) => void): void {
    const user = this.findUserByWs(ws);
    if (user) {
      this.users.delete(user);
      if (this.leader?.username === user.username) {
        this.leader = this.users.size > 0 ? Array.from(this.users.keys())[0] : null;
      }
      onDisconnect(user);
    }
  }
  
  findUserByWs(ws: MyWebSocket): User | undefined {
    return Array.from(this.users.keys()).find(user => this.users.get(user) === ws);
  }

  findUserByUsername(username: string): User | undefined {
    return Array.from(this.users.keys()).find(user => user.username === username);
  }
  
  getLeader(): User | null {
      return this.leader;
  }
  
  getAllUsers(): User[] {
      return Array.from(this.users.keys());
  }

  getWebSocketByUser(user: User): MyWebSocket | undefined {
      return this.users.get(user);
  }

  broadcast(message: WebSocketMessage): void {
    this.users.forEach(ws => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  broadcastUserList(): void {
    const userList = this.getAllUsers().map(user => ({
        username: user.username,
        points: user.points,
    }));
    this.broadcast({ type: MESSAGE_TYPES.USER_LIST_UPDATE, payload: userList });
  }

  updateUser(user: User): void {
    const ws = this.getWebSocketByUser(user);
    if (ws) {
        ws.send(JSON.stringify({ type: MESSAGE_TYPES.GET_USER_RESPONSE, payload: user }));
    }
  }
}