import { useEffect, useState } from "react";
import "./App.css";

type QuestionData = {
  questionNum: number;
  title: string;
  answers: { a: string; b: string; c: string; d: string };
  image?: string;
  correct?: string;
};

function parseHTMLtoQuestion(html: string): QuestionData | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const h3 = doc.querySelector("h3.onequestion");
  if (!h3) return null;
  const questionNumMatch = h3.textContent?.match(/numer: (\d+)/);
  const questionNum = questionNumMatch ? parseInt(questionNumMatch[1]) : 0;

  const title = doc.querySelector("div.title")?.textContent?.trim() || "";

  const getAnswerText = (id: string) => {
    const el = doc.getElementById(id);
    if (!el) return "";
    return el.textContent?.replace(/^[A-D]\.\s*/, "").trim() || "";
  };

  const answers = {
    a: getAnswerText("odpa"),
    b: getAnswerText("odpb"),
    c: getAnswerText("odpc"),
    d: getAnswerText("odpd"),
  };

  const imgSrc =
    doc.querySelector("div.image img")?.getAttribute("src") || undefined;

  return {
    questionNum,
    title,
    answers,
    image: imgSrc,
  };
}

function App() {
  const [questionNum, setQuestionNum] = useState(1);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<number[]>(() => {
    const stored = localStorage.getItem("wrongAnswers");
    return stored ? JSON.parse(stored) : [];
  });
  const [inputValue, setInputValue] = useState<string>("1");

  const saveWrongAnswers = (list: number[]) => {
    localStorage.setItem("wrongAnswers", JSON.stringify(list));
  };

  const loadQuestion = (value: number, direction: number) => {
    const formData = new URLSearchParams();
    formData.append("value", value.toString());
    formData.append("var", direction.toString());

    fetch("/api/inf04/teoria/jedno/loadquestion.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    })
      .then((res) => res.text())
      .then((html) => {
        const parsed = parseHTMLtoQuestion(html);
        if (parsed) {
          setQuestionData(parsed);
          setQuestionNum(parsed.questionNum);
          setSelectedAnswer(null);
          setInputValue(parsed.questionNum.toString());
        } else {
          console.error("Nie udało się sparsować pytania");
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadQuestion(questionNum, 0);
  }, []);

  const handleAnswer = (letter: string) => {
    setSelectedAnswer(letter);
    if (questionData && questionData.correct !== letter) {
      if (!wrongAnswers.includes(questionNum)) {
        const updated = [...wrongAnswers, questionNum];
        setWrongAnswers(updated);
        saveWrongAnswers(updated);
      }
    }
  };

  const goToNext = () => {
    loadQuestion(questionNum, 1);
  };

  const goToPrevious = () => {
    if (questionNum > 1) {
      loadQuestion(questionNum, -1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleGoToQuestion = () => {
    const num = parseInt(inputValue);
    if (!isNaN(num) && num > 0) {
      loadQuestion(num, 0);
    }
  };

  const handleWrongClick = (num: number) => {
    loadQuestion(num, 0);
  };

  return (
    <div className="app-container">
      <main>
        <h2>Pytanie {questionNum}</h2>

        <div className="input-group">
          <input
            type="number"
            min={1}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGoToQuestion();
            }}
            placeholder="Numer pytania"
          />
          <button onClick={handleGoToQuestion}>Idź do pytania</button>
        </div>

        {questionData ? (
          <>
            <div className="question-title">{questionData.title}</div>

            <div className="answers-list">
              {(["a", "b", "c", "d"] as const).map((letter) => (
                <div
                  key={letter}
                  onClick={() => handleAnswer(letter)}
                  className={selectedAnswer === letter ? "selected" : ""}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleAnswer(letter);
                  }}
                >
                  <strong>{letter.toUpperCase()}.</strong>{" "}
                  {questionData.answers[letter]}
                </div>
              ))}
            </div>

            {questionData.image && (
              <img
                src={
                  questionData.image.startsWith("http")
                    ? questionData.image
                    : `https://www.praktycznyegzamin.pl/inf04/teoria/jedno/${questionData.image}`
                }
                alt="ilustracja do pytania"
                className="question-image"
              />
            )}

            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
              <button onClick={goToPrevious} disabled={questionNum === 1}>
                Wstecz
              </button>
              <button onClick={goToNext}>Dalej</button>
            </div>
          </>
        ) : (
          <p>Ładowanie pytania...</p>
        )}
      </main>

      <aside className="history-panel">
        <h4>Niepoprawne odpowiedzi</h4>
        {wrongAnswers.length === 0 ? (
          <p>Brak</p>
        ) : (
          <ul>
            {wrongAnswers.map((q) => (
              <li
                key={q}
                onClick={() => handleWrongClick(q)}
                title="Kliknij, aby przejść do pytania"
              >
                Pytanie {q}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

export default App;
