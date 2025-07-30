export class User {
  username: string;
  hand: string[];
  points: number;

  constructor(username: string, hand: string[], points: number = 0) {
    this.username = username;
    this.hand = hand;
    this.points = points;
  }
}