type Props = { image?: string; video?: string };

export default function MediaDisplay({ image, video }: Props) {
  return (
    <>
      {image && (
        <div className="image-container">
          <img
            src={
              image.startsWith("http")
                ? image
                : `https://www.praktycznyegzamin.pl/inf04/teoria/jedno/${image}`
            }
            alt="ilustracja do pytania"
          />
        </div>
      )}
      {video && (
        <div className="video-container">
          <video controls>
            <source
              src={
                video.startsWith("http")
                  ? video
                  : `https://www.praktycznyegzamin.pl/inf04/teoria/jedno/${video}`
              }
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </>
  );
}
