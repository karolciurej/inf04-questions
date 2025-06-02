import { useEffect, useState } from "react";
import {
  parseHTMLtoQuestion,
  type QuestionData,
} from "./utils/parseHtmlToQuestion";
import QuestionViewer from "./components/questionViewer";
import SidePanel from "./components/SidePanel";

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
  const [mode, setMode] = useState<"standard" | "wrong">("standard");
  const [wrongIndex, setWrongIndex] = useState(0);
  const goToNext = () => {
    if (mode === "standard") {
      setQuestionNum((prev) => prev + 1);
    } else {
      setWrongIndex((prev) => Math.min(prev + 1, wrongAnswers.length - 1));
    }
  };

  const goToPrev = () => {
    if (mode === "standard") {
      setQuestionNum((prev) => Math.max(0, prev - 1));
    } else {
      setWrongIndex((prev) => Math.max(0, prev - 1));
    }
  };

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
            let cleaned = correctAnswer
              .trim()
              .toLowerCase()
              .split("h3")[1]
              ?.split("<")[0]
              ?.split("to ")[1];

            if (!cleaned) {
              cleaned = correctAnswer
                .trim()
                .toLowerCase()
                .split("odpowiedź ")[1]
                ?.split(" na pytanie")[0];
            }

            parsed.correct = cleaned;
            setQuestionData(parsed);
            setSelectedAnswer(null);
          });
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (mode === "standard") {
      loadQuestion(questionNum);
    } else if (mode === "wrong" && wrongAnswers.length > 0) {
      loadQuestion(wrongAnswers[wrongIndex]);
    }
  }, [questionNum, wrongIndex, mode]);

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
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => setMode("standard")}>Tryb standardowy</button>
          <button
            onClick={() => {
              if (wrongAnswers.length > 0) {
                setMode("wrong");
                setWrongIndex(0);
              } else {
                alert("Brak błędnych odpowiedzi.");
              }
            }}
            style={{ marginLeft: "10px" }}
          >
            Test z błędnych odpowiedzi
          </button>
        </div>
        <h2>
          Pytanie{" "}
          {mode === "standard" ? questionNum + 1 : wrongAnswers[wrongIndex] + 1}
        </h2>
        {questionData ? (
          <QuestionViewer
            questionNum={
              mode === "standard" ? questionNum : wrongAnswers[wrongIndex]
            }
            questionData={questionData}
            selectedAnswer={selectedAnswer}
            onAnswer={handleAnswer}
            doneQuestions={doneQuestions}
            inputQuestion={inputQuestion}
            setInputQuestion={setInputQuestion}
            onNext={goToNext}
            onBack={goToPrev}
            onJump={handleJumpToQuestion}
          />
        ) : (
          <p>Ładowanie pytania...</p>
        )}
      </div>

      <SidePanel
        wrongAnswers={wrongAnswers}
        doneQuestions={doneQuestions}
        onJumpToQuestion={(q) => {
          setMode("standard");
          setQuestionNum(q);
        }}
      />
    </div>
  );
}

export default App;
