import questions from '../cards/questions.json';
import answers from '../cards/answers.json';

let questionDeck = [...questions];
const answerLastUsed: { [key: string]: number } = {};

function shuffleQuestions(): void {
  questionDeck = [...questions].sort(() => 0.5 - Math.random());
}

shuffleQuestions();

export function getRandomHand(deck: string[], count: number, currentHand: string[] = []): string[] {
  const newCards: string[] = [];
  const availableCards = deck.filter(card => !currentHand.includes(card));

  if (availableCards.length === 0) {
    return [];
  }

  for (let i = 0; i < count; i++) {
    const weightedCards: { card: string; weight: number }[] = availableCards.map(card => {
      const lastUsedTime = answerLastUsed[card] || 0;
      const timeSinceLastUse = Date.now() - lastUsedTime;
      const weight = timeSinceLastUse > 0 ? timeSinceLastUse : 1; // Give more weight to older cards
      return { card, weight };
    });

    const totalWeight = weightedCards.reduce((sum, wc) => sum + wc.weight, 0);
    let random = Math.random() * totalWeight;

    let chosenCard: string | null = null;
    for (const wc of weightedCards) {
      random -= wc.weight;
      if (random <= 0) {
        chosenCard = wc.card;
        break;
      }
    }

    if (chosenCard) {
      newCards.push(chosenCard);
      answerLastUsed[chosenCard] = Date.now();
      // Remove chosen card from available cards for this draw to prevent duplicates in the same hand draw
      const index = availableCards.indexOf(chosenCard);
      if (index > -1) {
        availableCards.splice(index, 1);
      }
    } else {
      // Fallback to random if no card was chosen (should not happen with correct weights)
      const fallbackCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      if (fallbackCard) {
        newCards.push(fallbackCard);
        answerLastUsed[fallbackCard] = Date.now();
        const index = availableCards.indexOf(fallbackCard);
        if (index > -1) {
          availableCards.splice(index, 1);
        }
      }
    }
  }
  return newCards;
}

export function drawNewQuestion(): string {
  if (questionDeck.length === 0) {
    shuffleQuestions();
  }
  return questionDeck.pop() || "Não há mais perguntas.";
}
