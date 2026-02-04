import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, Play, Link as LinkIcon, MessageSquare, Music } from 'lucide-react';
import { FeedbackList } from './FeedbackList';

interface Feedback {
    id: string;
    content: string;
    created_at: string;
    reply: string | null;
    is_unlocked: boolean;
    track_id: string;
}

interface Track {
    id: string;
    title: string;
    url: string;
    platform: 'youtube' | 'soundcloud';
    created_at: string;
    order_index?: number;
    feedbacks?: Feedback[];
    thumbnail_url?: string; // For SoundCloud/Custom artwork
}

interface TrackListOverlayProps {
    isOpen: boolean;
    view: 'list' | 'detail';
    tracks: Track[];
    selectedTrack: Track | null;
    isOwner: boolean;
    onClose: () => void;
    onBackToList: () => void;
    onTrackClick: (track: Track) => void;
    onCopyLink: (trackId: string, e?: React.MouseEvent) => void;
    onReply: (fid: string, tid: string, content: string) => void;
    onUnlock: (fid: string, tid: string) => void;
    onSubmitFeedback: (trackId: string, content: string) => Promise<void>;
    artistName?: string;
}

const FeedbackSection = ({
    track,
    isOwner,
    onReply,
    onUnlock,
    onSubmitFeedback
}: {
    track: Track;
    isOwner: boolean;
    onReply: (fid: string, tid: string, content: string) => void;
    onUnlock: (fid: string, tid: string) => void;
    onSubmitFeedback: (trackId: string, content: string) => Promise<void>;
}) => {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setIsSubmitting(true);
        try {
            await onSubmitFeedback(track.id, comment);
            setComment('');
        } catch (err) {
            // Error handled by parent
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white/90">
                <MessageSquare className="w-5 h-5" /> Secret Feedback
            </h3>

            {/* Submit Form (Always visible to Public) */}
            {!isOwner && (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Send anonymous feedback..."
                        className="flex-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all font-medium"
                        required
                    />
                    <button
                        disabled={isSubmitting}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 border border-white/10 active:scale-95"
                    >
                        {isSubmitting ? '...' : 'Send'}
                    </button>
                </form>
            )}

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                <FeedbackList
                    feedbacks={track.feedbacks}
                    isOwner={isOwner}
                    onReply={onReply}
                    onUnlock={onUnlock}
                    trackId={track.id}
                />
            </div>
        </div>
    );
};

// --- High-Res Thumbnail Enforcer Component ---
const ThumbnailImage: React.FC<{
    track: Track;
    className?: string;
}> = ({ track, className }) => {
    const [hasError, setHasError] = useState(false);

    // YouTube / SoundCloud Upgrade Logic
    const getHighResThumbnail = (t: Track) => {
        // YouTube: Attempt maxresdefault (High Res)
        if (t.platform === 'youtube') {
            const videoId = t.url.split('v=')[1]?.split('&')[0] || t.url.split('/').pop();
            if (videoId) {
                // Return maxresdefault by default. Fallback to hqdefault on error.
                return !hasError
                    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                    : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }
        }

        // SoundCloud: Replace -large.jpg with -t500x500.jpg for high-res
        const thumbUrl = t.thumbnail_url;
        if (t.platform === 'soundcloud' && thumbUrl) {
            return thumbUrl.replace('-large.jpg', '-t500x500.jpg');
        }

        return thumbUrl || null;
    };

    const src = getHighResThumbnail(track);

    if (!src) return null;

    return (
        <img
            src={src}
            alt={track.title}
            className={`${className} object-cover`}
            loading="lazy"
            onError={() => {
                // If maxres fails on YouTube, fallback to lower res
                if (!hasError && track.platform === 'youtube') {
                    setHasError(true);
                }
            }}
        />
    );
};

const TrackListOverlay: React.FC<TrackListOverlayProps> = ({
    isOpen,
    view,
    tracks,
    selectedTrack,
    isOwner,
    onClose,
    onBackToList,
    onTrackClick,
    onCopyLink,
    onReply,
    onUnlock,
    onSubmitFeedback,
    artistName
}) => {
    const [tapSelectedId, setTapSelectedId] = useState<string | null>(null);

    const handleItemTap = (trackId: string) => {
        setTapSelectedId(prev => (prev === trackId ? null : trackId));
    };

    const sortedTracks = [...tracks].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    // Fallback Backgrounds
    const fallbacks = [
        'from-purple-600 to-blue-600',
        'from-indigo-500 via-purple-500 to-pink-500',
        'from-blue-600 to-indigo-700',
        'from-rose-500 to-orange-500',
        'from-emerald-500 to-teal-700'
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative z-20 flex items-center justify-between p-4 bg-slate-900/50 border-b border-white/5 backdrop-blur-3xl">
                        {view === 'detail' ? (
                            <button onClick={onBackToList} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <ChevronLeft className="w-6 h-6 text-white" />
                            </button>
                        ) : (
                            <div className="w-10" />
                        )}

                        <h2 className="text-lg font-bold text-white/90 tracking-tight">
                            {view === 'list' ? 'Discography' : 'Now Playing'}
                        </h2>

                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex-1 overflow-y-auto p-2">
                        {view === 'list' ? (
                            <div className="grid grid-cols-2 gap-1.5 md:gap-3 max-w-4xl mx-auto">
                                {sortedTracks.map((track, index) => {
                                    const isSelected = tapSelectedId === track.id;
                                    const fallbackGradient = fallbacks[index % fallbacks.length];
                                    const hasThumb = track.platform === 'youtube' || track.thumbnail_url;

                                    return (
                                        <div
                                            key={track.id}
                                            onClick={() => handleItemTap(track.id)}
                                            className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-lg ring-1 ring-white/5 active:scale-95 transition-all duration-300 bg-neutral-900"
                                        >
                                            {hasThumb ? (
                                                <ThumbnailImage
                                                    track={track}
                                                    className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center p-4 relative`}>
                                                    <div className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isSelected ? 'opacity-0 blur-sm' : 'opacity-100'}`}>
                                                        <span className="text-7xl font-black text-white/10 select-none uppercase absolute">
                                                            {track.title.charAt(0)}
                                                        </span>
                                                        <h3 className="text-white font-bold text-center text-sm md:text-base leading-tight drop-shadow-lg line-clamp-3 relative z-10">
                                                            {track.title}
                                                        </h3>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tap Overlay (Selected State) */}
                                            <div
                                                className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center ${isSelected ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                                    }`}
                                            >
                                                <div className="space-y-1 mb-4">
                                                    <h3 className="text-white font-bold text-base md:text-lg leading-tight line-clamp-2">
                                                        {track.title}
                                                    </h3>
                                                    {artistName && (
                                                        <p className="text-white/60 text-xs md:text-sm font-medium">
                                                            {artistName}
                                                        </p>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onTrackClick(track);
                                                    }}
                                                    className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform"
                                                >
                                                    <Play className="w-7 h-7 md:w-8 md:h-8 text-black ml-1 fill-black" />
                                                </button>

                                                <button
                                                    onClick={(e) => onCopyLink(track.id, e)}
                                                    className="absolute bottom-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                                                >
                                                    <LinkIcon className="w-4 h-4 text-white/70" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* DETAIL VIEW (RENEWED DESIGN) */
                            selectedTrack && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="max-w-xl mx-auto px-4 py-6 md:py-12 space-y-8"
                                >
                                    {/* Player Area */}
                                    <div className="relative group">
                                        <div className="aspect-square w-full max-w-sm mx-auto rounded-[2.5rem] overflow-hidden bg-black shadow-[0_40px_60px_-15px_rgba(0,0,0,0.7)] border border-white/10 ring-1 ring-white/10">
                                            {selectedTrack.platform === 'youtube' ? (
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${selectedTrack.url.split('v=')[1]?.split('&')[0] || selectedTrack.url.split('/').pop()}?autoplay=1&playsinline=1&theme=dark&color=white&modestbranding=1&rel=0&iv_load_policy=3&controls=1`}
                                                    className="w-full h-full"
                                                    allow="autoplay; encrypted-media"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    scrolling="no"
                                                    frameBorder="no"
                                                    allow="autoplay"
                                                    src={`https://w.soundcloud.com/player/?url=${selectedTrack.url}&color=%23ffffff&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Typography */}
                                    <div className="space-y-3 text-left max-w-sm mx-auto">
                                        <div className="flex items-start justify-between gap-4">
                                            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tighter leading-[0.95] flex-1">
                                                {selectedTrack.title}
                                            </h1>
                                            <button
                                                onClick={() => onCopyLink(selectedTrack.id)}
                                                className="mt-1 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl transition-all flex-shrink-0"
                                            >
                                                <LinkIcon className="w-5 h-5 text-white" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg text-white/60 font-semibold tracking-tight">
                                                {artistName || "Artist"}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-white/20" />
                                            <span className="text-[10px] text-white/30 uppercase font-black tracking-[0.2em]">
                                                {selectedTrack.platform}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Feedback Area */}
                                    <div className="max-w-sm mx-auto pt-6 border-t border-white/5">
                                        <FeedbackSection
                                            track={selectedTrack}
                                            isOwner={isOwner}
                                            onReply={onReply}
                                            onUnlock={onUnlock}
                                            onSubmitFeedback={onSubmitFeedback}
                                        />
                                    </div>
                                </motion.div>
                            )
                        )}

                        {view === 'list' && sortedTracks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-white/30 space-y-4">
                                <Music className="w-12 h-12 opacity-20" />
                                <p>No tracks found.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TrackListOverlay;
