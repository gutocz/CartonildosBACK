import { User } from '../user/User';
import { CardOnTable, WebSocketMessage } from '../types';
import { getRandomHand, drawNewQuestion } from '../utils/deck';
import { CircularQueue } from './CircularQueue';
import { MESSAGE_TYPES, GAME_RULES } from '../config/constants';
import answers from '../cards/answers.json';

export class GameManager {
  private static instance: GameManager;
  public question: string = "";
  public roundMaster: User | null = null;
  public table = new Map<string, CardOnTable>();
  public gameIsRunning = false;
  private userQueue: CircularQueue | null = null;

  private constructor() {}

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  startGame(users: Map<User, any>, broadcast: (message: WebSocketMessage) => void): void {
    if (users.size < GAME_RULES.MIN_PLAYERS_TO_START) {
      throw new Error(`São necessários pelo menos ${GAME_RULES.MIN_PLAYERS_TO_START} jogadores para começar.`);
    }
    this.gameIsRunning = true;
    this.userQueue = new CircularQueue(users);
    this.startNextRound(broadcast);
  }

  restartGame(users: Map<User, any>, broadcast: (message: WebSocketMessage) => void, updateUser: (user: User) => void): void {
    this.gameIsRunning = false;
    this.table.clear();
    this.roundMaster = null;
    this.question = "";
    users.forEach((_ws, user) => {
      user.points = 0;
      user.hand = getRandomHand(answers, GAME_RULES.CARDS_PER_HAND);
      updateUser(user);
    });
    broadcast({ type: MESSAGE_TYPES.RESTART_GAME_RESPONSE, payload: {} });
  }

  startNextRound(broadcast: (message: WebSocketMessage) => void): void {
    if (!this.userQueue) return;
    this.table.clear();
    this.roundMaster = this.userQueue.next();
    this.question = drawNewQuestion();
    
    if (!this.roundMaster) {
        this.gameIsRunning = false;
        return;
    }

    broadcast({
      type: MESSAGE_TYPES.NEXT_ROUND_RESPONSE,
      payload: { roundMaster: this.roundMaster.username, question: this.question }
    });
    this.broadcastTable(broadcast);
  }
  
  addCardToTable(owner: User, cardContent: string, broadcast: (message: WebSocketMessage) => void): void {
    if (owner && cardContent && owner.username !== this.roundMaster?.username) {
      this.table.set(owner.username, { cardContent, revealed: false });
      owner.hand = owner.hand.filter(card => card !== cardContent);
      this.broadcastTable(broadcast);
    }
  }

  revealCard(ownerUsername: string, broadcast: (message: WebSocketMessage) => void): void {
    const card = this.table.get(ownerUsername);
    if (card) {
      card.revealed = true;
      this.table.set(ownerUsername, card);
      this.broadcastTable(broadcast);
    }
  }

  chooseWinner(winnerUsername: string, users: Map<User, any>, broadcast: (message: WebSocketMessage) => void): void {
    const winner = Array.from(users.keys()).find(u => u.username === winnerUsername);
    const winningCard = this.table.get(winnerUsername);

    if (winner && winningCard) {
      winner.points += 1;
      broadcast({
        type: MESSAGE_TYPES.WINNER_CHOSEN,
        payload: { 
            winner: winner.username, 
            points: winner.points,
            cardContent: winningCard.cardContent 
        }
      });

      setTimeout(() => {
        this.refillHands(users);
        this.startNextRound(broadcast);
      }, GAME_RULES.WINNER_REVEAL_DELAY);
    }
  }
  
  private refillHands(users: Map<User, any>): void {
      users.forEach((_ws, user) => {
          const cardsToDraw = GAME_RULES.CARDS_PER_HAND - user.hand.length;
          if (cardsToDraw > 0) {
              const newCards = getRandomHand(answers, cardsToDraw, user.hand);
              user.hand.push(...newCards);
          }
      });
  }

  handleDisconnect(disconnectedUser: User, broadcast: (message: WebSocketMessage) => void): void {
    this.table.delete(disconnectedUser.username);
    this.broadcastTable(broadcast);

    if (this.userQueue) {
        this.userQueue.removeUser(disconnectedUser);
    }

    if (this.gameIsRunning && this.roundMaster?.username === disconnectedUser.username) {
        this.startNextRound(broadcast);
    }
  }

  broadcastTable(broadcast: (message: WebSocketMessage) => void): void {
    broadcast({ type: MESSAGE_TYPES.TABLE_RESPONSE, payload: Object.fromEntries(this.table) });
  }
}
