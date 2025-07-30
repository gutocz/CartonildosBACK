import questions from '../cards/questions.json';

export function getRandomHand(deck: string[], count: number): string[] {
  const shuffled = [...deck].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function drawNewQuestion(currentQuestion: string): string {
    let newQuestion: string;
    do {
        const randomIndex = Math.floor(Math.random() * questions.length);
        newQuestion = questions[randomIndex];
    } while (newQuestion === currentQuestion);
    return newQuestion;
}