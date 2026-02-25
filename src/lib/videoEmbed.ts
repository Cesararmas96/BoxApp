export type VideoEmbedType = 'youtube' | 'vimeo' | 'direct' | null;

export interface VideoEmbedResult {
    type: VideoEmbedType;
    embedUrl: string | null;
    thumbnailUrl: string | null;
}

function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function extractVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
}

function isDirectVideo(url: string): boolean {
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

export function resolveVideoEmbed(url: string | null | undefined): VideoEmbedResult {
    if (!url) return { type: null, embedUrl: null, thumbnailUrl: null };

    const ytId = extractYouTubeId(url);
    if (ytId) {
        return {
            type: 'youtube',
            embedUrl: `https://www.youtube.com/embed/${ytId}`,
            thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        };
    }

    const vimeoId = extractVimeoId(url);
    if (vimeoId) {
        return {
            type: 'vimeo',
            embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
            thumbnailUrl: null,
        };
    }

    if (isDirectVideo(url)) {
        return {
            type: 'direct',
            embedUrl: url,
            thumbnailUrl: null,
        };
    }

    return { type: null, embedUrl: null, thumbnailUrl: null };
}
