const MUSICBRAINZ_API = 'https://musicbrainz.org/ws/2';
const COVERART_API = 'https://coverartarchive.org';

export interface MusicBrainzResult {
  title: string;
  artist: string;
  album: string;
  year?: number;
  genre?: string;
  coverUrl?: string;
}

export async function queryMusicBrainz(title: string, artist: string): Promise<MusicBrainzResult | null> {
  try {
    // Recording suchen
    const query = encodeURIComponent(`"${title}" AND artist:"${artist}"`);
    const url = `${MUSICBRAINZ_API}/recording?query=${query}&fmt=json&limit=3`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'MusicFetch/1.0 (naix1337@github.com)' }
    });
    if (!res.ok) return null;
    const data = await res.json();

    const recording = data?.recordings?.[0];
    if (!recording) return null;

    const result: MusicBrainzResult = {
      title: recording.title || title,
      artist: recording['artist-credit']?.[0]?.name || artist,
      album: '',
    };

    // Release finden (für Album + Jahr)
    if (recording.releases?.[0]) {
      const releaseId = recording.releases[0].id;
      result.album = recording.releases[0].title || '';

      // Release-Details für Jahr
      const releaseRes = await fetch(`${MUSICBRAINZ_API}/release/${releaseId}?fmt=json`, {
        headers: { 'User-Agent': 'MusicFetch/1.0' }
      });
      if (releaseRes.ok) {
        const releaseData = await releaseRes.json();
        result.year = releaseData.date ? parseInt(releaseData.date.split('-')[0]) : undefined;
      }

      // Cover Art
      try {
        const coverRes = await fetch(`${COVERART_API}/release/${releaseId}/front-250`, {
          method: 'HEAD'
        });
        if (coverRes.ok) {
          result.coverUrl = `${COVERART_API}/release/${releaseId}/front-250`;
        }
      } catch {}
    }

    return result;
  } catch (e) {
    console.error('MusicBrainz error:', e);
    return null;
  }
}
