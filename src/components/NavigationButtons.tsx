type Props = {
  onBack: () => void;
  onNext: () => void;
  inputQuestion: string;
  setInputQuestion: (val: string) => void;
  onJump: () => void;
};

export default function NavigationButtons({
  onBack,
  onNext,
  inputQuestion,
  setInputQuestion,
  onJump,
}: Props) {
  return (
    <div style={{ marginTop: "10px" }}>
      <div className="btn-group">
        <button onClick={onBack}>Wstecz</button>
        <button onClick={onNext} style={{ marginLeft: "10px" }}>
          Dalej
        </button>
      </div>

      <div className="jump-input" style={{ marginTop: "10px" }}>
        <input
          type="number"
          placeholder="Numer pytania"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          min={1}
        />
        <button onClick={onJump}>Idź do pytania</button>
      </div>
    </div>
  );
}
    