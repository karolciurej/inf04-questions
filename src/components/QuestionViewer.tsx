import type { QuestionData } from "../utils/parseHtmlToQuestion";
import AnswersList from "./AnswerList";
import MediaDisplay from "./MediaDisplay";
import NavigationButtons from "./NavigationButtons";

type Props = {
  questionNum: number;
  questionData: QuestionData;
  selectedAnswer: string | null;
  doneQuestions: number[];
  onAnswer: (letter: string) => void;
  inputQuestion: string;
  setInputQuestion: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
  onJump: () => void;
};

export default function QuestionViewer({
  questionNum,
  questionData,
  selectedAnswer,
  doneQuestions,
  onAnswer,
  inputQuestion,
  setInputQuestion,
  onNext,
  onBack,
  onJump,
}: Props) {
  return (
    <div>
      <div className="question-title">{questionData.title}</div>

      <AnswersList
        answers={questionData.answers}
        correct={questionData.correct}
        selectedAnswer={selectedAnswer}
        done={doneQuestions.includes(questionNum)}
        onSelect={onAnswer}
      />

      <MediaDisplay image={questionData.image} video={questionData.video} />

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        inputQuestion={inputQuestion}
        setInputQuestion={setInputQuestion}
        onJump={onJump}
      />
    </div>
  );
}
