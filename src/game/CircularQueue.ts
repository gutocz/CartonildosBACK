import { User } from '../user/User';

export class CircularQueue {
  private users: User[];
  private currentIndex: number;

  constructor(usersMap: Map<User, any>) {
    this.users = Array.from(usersMap.keys());
    this.currentIndex = 0;
  }

  next(): User | null {
    if (this.users.length === 0) {
      return null;
    }
    const currentUser = this.users[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.users.length;
    return currentUser;
  }

  removeUser(userToRemove: User): void {
    const index = this.users.findIndex(user => user.username === userToRemove.username);
    if (index > -1) {
      const isRemovedUserBeforeCurrent = index < this.currentIndex;
      this.users.splice(index, 1);
      if (isRemovedUserBeforeCurrent) {
        this.currentIndex--;
      }
      if (this.currentIndex >= this.users.length) {
        this.currentIndex = 0;
      }
    }
  }
}