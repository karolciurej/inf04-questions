type Props = {
  wrongAnswers: number[];
  doneQuestions: number[];
  onJumpToQuestion: (q: number) => void;
};

export default function SidePanel({ wrongAnswers, doneQuestions, onJumpToQuestion }: Props) {
  return (
    <div className="side-panel">
      <h4>Niepoprawne odpowiedzi {wrongAnswers.length}:</h4>
      {wrongAnswers.length === 0 ? (
        <p>Brak</p>
      ) : (
        <ul>
          {wrongAnswers.map((q) => (
            <li key={q}>
              <button onClick={() => onJumpToQuestion(q)}>Pytanie {q + 1}</button>
            </li>
          ))}
        </ul>
      )}

      <h4>Zrobione pytania:</h4>
      {doneQuestions.length === 0 ? (
        <p>Brak</p>
      ) : (
        <ul>
          {doneQuestions.map((q) => (
            <li key={q}>
              <button onClick={() => onJumpToQuestion(q)}>Pytanie {q + 1}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
