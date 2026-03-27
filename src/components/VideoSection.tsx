import { useVideos, Video } from "@/hooks/useVideos";
import { useSiteContent } from "@/hooks/useSiteContent";

const getEmbedUrl = (video: Video) => {
  // Extract video ID from various YouTube URL formats (including Shorts)
  const extractYouTubeId = (url: string) => {
    // Match YouTube Shorts URL
    const shortsMatch = url.match(/youtube\.com\/shorts\/([^"&?\/\s]{11})/);
    if (shortsMatch) return shortsMatch[1];
    
    // Match regular YouTube URL formats
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (match) return match[1];
    
    return null;
  };

  if (video.video_type === "youtube" || video.video_type === "youtube_shorts") {
    const videoId = extractYouTubeId(video.video_url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return video.video_url;
  } else if (video.video_type === "tiktok") {
    // TikTok embed URL
    return video.video_url;
  }
  return video.video_url;
};

const VideoSection = () => {
  const { videos, loading } = useVideos();
  const { content } = useSiteContent();

  const youtubeVideos = videos.filter((v) => v.video_type === "youtube" && v.is_active);

  if (loading) {
    return (
      <section id="videos" className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">טוען סרטונים...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="videos" className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 
          className="section-title mb-10"
          style={{ fontFamily: `'${content.fontFamily}', sans-serif` }}
        >
          {content.videosTitle}
        </h2>
        {youtubeVideos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {youtubeVideos.map((video) => (
              <div key={video.id} className="minecraft-card overflow-hidden">
                <div className="aspect-video">
                  <iframe
                    src={getEmbedUrl(video)}
                    title={video.title}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{video.title}</h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="minecraft-card text-center py-12">
            <p className="text-muted-foreground">אין סרטונים עדיין. הוסף סרטונים דרך פאנל הניהול!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoSection;
