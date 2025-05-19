import { useEffect, useState } from "react";

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

  const questionNumMatch = h3.textContent?.match(/pytanie (\d+)/i);
  const questionNum = questionNumMatch ? parseInt(questionNumMatch[1]) - 1 : 0;

  const correctMatch = h3.textContent?.match(/poprawna odpowiedź.*?([A-D])/i);
  const correct = correctMatch ? correctMatch[1].toLowerCase() : undefined;

  const title = doc.querySelector("div.title")?.textContent?.trim() || "";

  const getAnswerText = (id: string) => {
    const el = doc.getElementById(id);
    return el?.textContent?.replace(/^[A-D]\.\s*/, "").trim() || "";
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
    correct,
  };
}

function App() {
  const [questionNum, setQuestionNum] = useState(0);
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
  const [inputQuestion, setInputQuestion] = useState("");

  const saveWrongAnswers = (list: number[]) =>
    localStorage.setItem("wrongAnswers", JSON.stringify(list));

  const saveDoneQuestions = (list: number[]) =>
    localStorage.setItem("doneQuestions", JSON.stringify(list));

  const loadQuestion = (num: number) => {
    const formData = new URLSearchParams();
    formData.append("value", (num + 1).toString());
    formData.append("var", "0");

    fetch("/api/inf04/teoria/jedno/loadquestion.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    })
      .then((res) => res.text())
      .then((html) => {
        const parsed = parseHTMLtoQuestion(html);
        if (!parsed) return;

        fetch("/api/inf04/teoria/jedno/loadanswer.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            idp: (num + 1).toString(),
            odp: "evjhv",
          }).toString(),
        })
          .then((res) => res.text())
          .then((correctAnswer) => {
            console.log(correctAnswer);
            let cleaned = correctAnswer
              .trim()
              .toLowerCase()
              .split("h3")[1]
              .split("<")[0]
              .split("to ")[1];
            if (!cleaned) {
              cleaned = correctAnswer
                .trim()
                .toLowerCase()
                .split("odpowiedź ")[1]
                .split(" na pytanie")[0];
            }
            parsed.correct = cleaned;

            setQuestionData(parsed);
            setSelectedAnswer(null);
          });
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadQuestion(questionNum);
  }, [questionNum]);

  const handleAnswer = (letter: string) => {
    setSelectedAnswer(letter);

    if (questionData && questionData.correct !== letter) {
      if (!wrongAnswers.includes(questionNum)) {
        const updated = [...wrongAnswers, questionNum];
        setWrongAnswers(updated);
        saveWrongAnswers(updated);
      }
    }

    if (!doneQuestions.includes(questionNum)) {
      const updated = [...doneQuestions, questionNum];
      setDoneQuestions(updated);
      saveDoneQuestions(updated);
    }
  };

  const handleJumpToQuestion = () => {
    const num = parseInt(inputQuestion);
    if (!isNaN(num) && num > 0) {
      setQuestionNum(num - 1);
      setInputQuestion("");
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <h2>Pytanie {questionNum + 1}</h2>

        {questionData ? (
          <>
            <div className="question-title">{questionData.title}</div>

            <div className="answers-list">
              {(["a", "b", "c", "d"] as const).map((letter) => {
                const isSelected = selectedAnswer === letter;
                const isCorrect = questionData.correct === letter;
                const isWrong = isSelected && !isCorrect;

                return (
                  <div
                    key={letter}
                    onClick={() => handleAnswer(letter)}
                    className={`answer-item ${
                      isSelected ? (isWrong ? "wrong" : "correct") : ""
                    } ${doneQuestions.includes(questionNum) ? "done" : ""}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        handleAnswer(letter);
                    }}
                  >
                    {" "}
                    {questionData.answers[letter]}
                  </div>
                );
              })}
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
              <button
                onClick={() => setQuestionNum(Math.max(0, questionNum - 1))}
              >
                Wstecz
              </button>
              <button
                onClick={() => setQuestionNum(questionNum + 1)}
                style={{ marginLeft: "10px" }}
              >
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
                <button onClick={() => setQuestionNum(q)}>
                  Pytanie {q + 1}
                </button>
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
                <button onClick={() => setQuestionNum(q)}>
                  Pytanie {q + 1}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
