import axios from 'axios';

export function getYoutubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function fetchYoutubeTranscript(url: string): Promise<{ text: string; title: string }> {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');

  // Fetch YouTube video page
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await axios.get(videoUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });

  const html = response.data;
  
  // Extract Video Title
  let title = `YouTube Video ${videoId}`;
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  if (titleMatch) {
    title = titleMatch[1].replace(' - YouTube', '').trim();
  }

  // Look for ytInitialPlayerResponse
  const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
  if (!playerResponseMatch) {
    throw new Error('Could not find player response. Video might be private or restricted.');
  }

  const playerResponse = JSON.parse(playerResponseMatch[1]);
  const captions = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captions || captions.length === 0) {
    throw new Error('Transcripts are not enabled/available for this video.');
  }

  // Prefer English captions, otherwise select first available
  let captionTrack = captions.find((track: any) => track.languageCode === 'en' || track.languageCode.startsWith('en'));
  if (!captionTrack) captionTrack = captions[0];

  const transcriptUrl = captionTrack.baseUrl;
  const transcriptResponse = await axios.get(transcriptUrl);
  const xml = transcriptResponse.data;

  // Extract text from XML (e.g. <text start="..." dur="...">Transcript line</text>)
  const textMatches = xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g);
  const lines: string[] = [];
  for (const match of textMatches) {
    // Decode HTML entities
    const decoded = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    lines.push(decoded);
  }

  if (lines.length === 0) {
    throw new Error('Transcript XML parsing returned empty text. Please check if captions exist.');
  }

  return {
    text: lines.join(' '),
    title,
  };
}
