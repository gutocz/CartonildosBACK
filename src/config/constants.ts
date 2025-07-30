export const MESSAGE_TYPES = {
  ERROR: 'error',
  CHAT: 'chat',
  JOIN_ROOM: 'joinRoom',
  SUCCESS_JOIN_ROOM: 'sucessJoinRoom',
  GET_MY_USER: 'getMyUser',
  GET_USER_RESPONSE: 'getUserResponse',
  GET_LEADER: 'getLeader',
  GET_LEADER_RESPONSE: 'getLeaderResponse',
  START_GAME: 'startGame',
  START_GAME_RESPONSE: 'startGameResponse',
  RESTART_GAME: 'restartGame',
  RESTART_GAME_RESPONSE: 'restartGameResponse',
  ADD_CARD_TO_TABLE: 'addCardToTable',
  TABLE_RESPONSE: 'tableResponse',
  REVEAL_CARD: 'revealCard',
  CHOOSE_WINNER: 'chooseWinner',
  WINNER_CHOSEN: 'winnerChosen',
  NEXT_ROUND: 'nextRound',
  NEXT_ROUND_RESPONSE: 'nextRoundResponse',
  USER_LIST_UPDATE: 'userListUpdate'
};

export const GAME_RULES = {
  MIN_PLAYERS_TO_START: 2,
  CARDS_PER_HAND: 5,
  WINNER_REVEAL_DELAY: 5000,
  HEARTBEAT_INTERVAL: 30000
};