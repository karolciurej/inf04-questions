import { useEffect, useState } from "react";

type QuestionData = {
  questionNum: number;
  title: string;
  answers: { a: string; b: string; c: string; d: string };
  image?: string;
  correct?: string; // nie zawsze dostępne
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
  // Domyślne pytanie to 1 lub to z URL param q
  const getInitialQuestionNum = () => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      const num = parseInt(q);
      if (!isNaN(num) && num > 0) return num;
    }
    return 1;
  };

  const [questionNum, setQuestionNum] = useState(getInitialQuestionNum);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<number[]>(() => {
    const stored = localStorage.getItem("wrongAnswers");
    return stored ? JSON.parse(stored) : [];
  });
  const [doneQuestions, setDoneQuestions] = useState<number[]>(() => {
    const stored = localStorage.getItem("doneQuestions");
    return stored ? JSON.parse(stored) : [];
  });
  const [history, setHistory] = useState<number[]>([questionNum]);
  const [inputQuestion, setInputQuestion] = useState<string>("");

  const saveWrongAnswers = (list: number[]) => {
    localStorage.setItem("wrongAnswers", JSON.stringify(list));
  };

  const saveDoneQuestions = (list: number[]) => {
    localStorage.setItem("doneQuestions", JSON.stringify(list));
  };

  // Funkcja ładująca pytanie i aktualizująca URL
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
          setHistory((prev) => [...prev, parsed.questionNum]);
          // Aktualizujemy URL bez przeładowania strony:
          const newUrl =
            window.location.protocol +
            "//" +
            window.location.host +
            window.location.pathname +
            `?q=${parsed.questionNum}`;
          window.history.replaceState({ path: newUrl }, "", newUrl);
        } else {
          console.error("Nie udało się sparsować pytania");
        }
      })
      .catch(console.error);
  };

  // Przy pierwszym renderze ładujemy pytanie z parametru lub 1
  useEffect(() => {
    loadQuestion(questionNum, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = (letter: string) => {
    setSelectedAnswer(letter);

    if (questionData && questionData.correct !== letter) {
      if (!wrongAnswers.includes(questionNum)) {
        const updatedWrong = [...wrongAnswers, questionNum];
        setWrongAnswers(updatedWrong);
        saveWrongAnswers(updatedWrong);

        // Po błędnej odpowiedzi wymuszamy ustawienie URL na to pytanie
        const newUrl =
          window.location.protocol +
          "//" +
          window.location.host +
          window.location.pathname +
          `?q=${questionNum}`;
        window.history.replaceState({ path: newUrl }, "", newUrl);
      }
    }

    if (!doneQuestions.includes(questionNum)) {
      const updatedDone = [...doneQuestions, questionNum];
      setDoneQuestions(updatedDone);
      saveDoneQuestions(updatedDone);
    }
  };

  const goToNext = () => {
    loadQuestion(questionNum, 1);
  };

  const goToPrevious = () => {
    if (questionNum > 1) {
      loadQuestion(questionNum , -1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputQuestion(e.target.value);
  };

  const handleJumpToQuestion = () => {
    const num = parseInt(inputQuestion);
    if (num > 0) {
      loadQuestion(num, 0);
      setInputQuestion("");
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <h2>Pytanie {questionNum}</h2>

        {questionData ? (
          <>
            <div className="question-title">{questionData.title}</div>

            <div className="answers-list">
              {(["a", "b", "c", "d"] as const).map((letter) => (
                <div
                  key={letter}
                  onClick={() => handleAnswer(letter)}
                  className={`answer-item ${
                    selectedAnswer === letter ? "selected" : ""
                  } ${doneQuestions.includes(questionNum) ? "done" : ""}`}
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
              <div className="image-container">
                <img
                  src={
                    questionData.image.startsWith("http")
                      ? questionData.image
                      : `https://www.praktycznyegzamin.pl/inf04/teoria/jedno/${questionData.image}`
                  }
                  alt="ilustracja do pytania"
                />
              </div>
            )}

            <div className="btn-group" style={{ marginTop: "10px" }}>
              <button onClick={goToPrevious} disabled={questionNum === 1}>
                Wstecz
              </button>
              <button onClick={goToNext} style={{ marginLeft: "10px" }}>
                Dalej
              </button>
            </div>

            <div className="jump-input" style={{ marginTop: "10px" }}>
              <input
                type="number"
                placeholder="Numer pytania"
                value={inputQuestion}
                onChange={handleInputChange}
                min={1}
              />
              <button onClick={handleJumpToQuestion}>Idź do pytania</button>
            </div>
          </>
        ) : (
          <p>Ładowanie pytania...</p>
        )}
      </div>

      <div className="side-panel">
        <h4>Niepoprawne odpowiedzi:</h4>
        {wrongAnswers.length === 0 ? (
          <p>Brak</p>
        ) : (
          <ul>
            {wrongAnswers.map((q) => (
              <li key={q}>
                {" "}
                <a href={`/?q=${q}`}>Pytanie {q}</a>
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
                <a href={`/?q=${q}`}>Pytanie {q}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
