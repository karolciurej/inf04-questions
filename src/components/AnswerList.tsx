type Props = {
  answers: { a: string; b: string; c: string; d: string };
  correct?: string;
  selectedAnswer: string | null;
  done: boolean;
  onSelect: (letter: string) => void;
};

export default function AnswersList({
  answers,
  correct,
  selectedAnswer,
  done,
  onSelect,
}: Props) {
  return (
    <div className="answers-list">
      {(["a", "b", "c", "d"] as const).map((letter) => {
        const isSelected = selectedAnswer === letter;
        const isCorrect = correct === letter;
        const isWrong = isSelected && !isCorrect;

        return (
          <div
            key={letter}
            onClick={() => onSelect(letter)}
            className={`answer-item ${
              isSelected ? (isWrong ? "wrong" : "correct") : ""
            } ${done ? "done" : ""}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect(letter);
            }}
          >
            {answers[letter]}
          </div>
        );
      })}
    </div>
  );
}
