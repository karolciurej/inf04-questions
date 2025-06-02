export type QuestionData = {
  questionNum: number;
  title: string;
  answers: { a: string; b: string; c: string; d: string };
  image?: string;
  video?: string;
  correct?: string;
};

export function parseHTMLtoQuestion(html: string): QuestionData | null {
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

  const imgSrc = doc.querySelector("div.image img")?.getAttribute("src") || undefined;
  const videoSrc = doc.querySelector("source")?.getAttribute("src") || undefined;

  return {
    questionNum,
    title,
    answers,
    image: imgSrc,
    video: videoSrc,
    correct,
  };
}
