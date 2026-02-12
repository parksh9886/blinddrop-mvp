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
    vibe_energy?: number;
    vibe_mood?: number;
    vibe_style?: number;
    situations?: string[];
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
    onSubmitFeedback: (trackId: string, content: string, vibes?: { energy: number; mood: number; style: number }, situations?: string[]) => Promise<void>;
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
    onSubmitFeedback: (trackId: string, content: string, vibes?: { energy: number; mood: number; style: number }, situations?: string[]) => Promise<void>;
}) => {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [vibe_energy, setVibeEnergy] = useState(50);
    const [vibe_mood, setVibeMood] = useState(50);
    const [vibe_style, setVibeStyle] = useState(50);
    const [selectedSituations, setSelectedSituations] = useState<string[]>([]);

    const situations = [
        { id: 'focus', label: '🏠집중' },
        { id: 'workout', label: '💪운동' },
        { id: 'mood', label: '🌃감성' },
        { id: 'drive', label: '🚗드라이브' },
        { id: 'commute', label: '🚃출퇴근' },
        { id: 'chill', label: '☕휴식' },
        { id: 'party', label: '🎉파티' },
        { id: 'comfort', label: '🩹위로' }
    ];

    const toggleSituation = (label: string) => {
        setSelectedSituations(prev =>
            prev.includes(label)
                ? prev.filter(s => s !== label)
                : [...prev, label]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() && selectedSituations.length === 0 && vibe_energy === 50 && vibe_mood === 50 && vibe_style === 50) return;

        setIsSubmitting(true);
        try {
            await onSubmitFeedback(
                track.id,
                comment,
                { energy: vibe_energy, mood: vibe_mood, style: vibe_style },
                selectedSituations
            );
            setComment('');
            setVibeEnergy(50);
            setVibeMood(50);
            setVibeStyle(50);
            setSelectedSituations([]);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasContent = comment.length > 0 || selectedSituations.length > 0 || vibe_energy !== 50 || vibe_mood !== 50 || vibe_style !== 50;

    return (
        <div className="space-y-8">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white/90">
                <MessageSquare className="w-5 h-5" /> Secret Feedback
            </h3>

            {/* SUbmit Form (Public Only) */}
            {!isOwner && (
                <div className="w-full bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    {/* Ambient Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

                    <div className="space-y-8 relative z-10">
                        {/* 1. Situation Tags */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">When to listen?</h4>
                            <div className="flex flex-wrap gap-2">
                                {situations.map((s) => {
                                    const isSelected = selectedSituations.includes(s.label);
                                    // Extract just text for cleaner look if needed, or keep full label
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => toggleSituation(s.label)}
                                            className={`
                                                pl-3 pr-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all duration-300 border
                                                ${isSelected
                                                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105'
                                                    : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-white/60'
                                                }
                                            `}
                                        >
                                            {/* s.label already has emoji, but effectively we could split it if we wanted specific styling. 
                                                For now using s.label as is. */}
                                            <span>{s.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Vibe Sliders */}
                        <div className="space-y-4 pt-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Vibe Check</h4>
                            <div className="space-y-5 bg-black/20 p-5 rounded-3xl border border-white/5">
                                {[
                                    { label: 'Energy', left: 'Calm', right: 'Hype', val: vibe_energy, set: setVibeEnergy, lCol: '#2dd4bf', rCol: '#f43f5e' },
                                    { label: 'Mood', left: 'Dark', right: 'Bright', val: vibe_mood, set: setVibeMood, lCol: '#8b5cf6', rCol: '#fbbf24' },
                                    { label: 'Style', left: 'Popular', right: 'Unique', val: vibe_style, set: setVibeStyle, lCol: '#3b82f6', rCol: '#d946ef' }
                                ].map((s) => {
                                    const isLeft = s.val < 50;
                                    const isRight = s.val > 50;
                                    const intensity = Math.abs(s.val - 50) / 50;

                                    return (
                                        <div key={s.label} className="flex flex-col gap-2 w-full select-none group">
                                            {/* Labels */}
                                            <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase transition-all duration-300 px-1">
                                                <span style={{
                                                    color: isLeft ? s.lCol : '#64748b',
                                                    opacity: isLeft ? 0.5 + (0.5 * intensity) : 0.4,
                                                    textShadow: (isLeft && intensity > 0.6) ? `0 0 10px ${s.lCol}` : 'none',
                                                    transform: isLeft ? `scale(${1 + intensity * 0.1})` : 'scale(1)'
                                                }} className="transition-transform duration-300">
                                                    {s.left}
                                                </span>
                                                <span style={{
                                                    color: isRight ? s.rCol : '#64748b',
                                                    opacity: isRight ? 0.5 + (0.5 * intensity) : 0.4,
                                                    textShadow: (isRight && intensity > 0.6) ? `0 0 10px ${s.rCol}` : 'none',
                                                    transform: isRight ? `scale(${1 + intensity * 0.1})` : 'scale(1)'
                                                }} className="transition-transform duration-300">
                                                    {s.right}
                                                </span>
                                            </div>

                                            {/* Slider Track */}
                                            <div className="relative h-6 flex items-center cursor-pointer touch-none">
                                                {/* Background Track */}
                                                <div className="absolute inset-x-0 h-2 bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
                                                    <div
                                                        className="absolute inset-0 opacity-80"
                                                        style={{
                                                            background: `linear-gradient(to right, 
                                                                ${isLeft ? s.lCol : 'transparent'} 0%, 
                                                                transparent 50%, 
                                                                ${isRight ? s.rCol : 'transparent'} 100%)`
                                                        }}
                                                    />
                                                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 -translate-x-1/2" />
                                                </div>

                                                {/* Input */}
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={s.val}
                                                    onChange={(e) => {
                                                        let val = parseInt(e.target.value);
                                                        if (val > 45 && val < 55) val = 50;
                                                        s.set(val);
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-grab active:cursor-grabbing"
                                                />

                                                {/* Thumb */}
                                                <div
                                                    className="absolute h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10 pointer-events-none transition-all duration-75 ease-out flex items-center justify-center"
                                                    style={{ left: `calc(${s.val}% - 8px)` }}
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900/20" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Message Input */}
                        <div className="relative group/input">
                            <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-lg transition-opacity duration-500 ${comment ? 'opacity-100' : 'opacity-0'}`} />
                            <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-end p-2 transition-colors focus-within:border-white/20 focus-within:bg-black/60">
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add a secret message..."
                                    className="w-full bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-0 resize-none p-3 max-h-32 min-h-[50px]"
                                    rows={1}
                                    style={{ height: 'auto' }}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = target.scrollHeight + 'px';
                                    }}
                                />
                                <button
                                    onClick={handleSubmit}
                                    disabled={!hasContent || isSubmitting}
                                    className={`
                                        mb-1 mr-1 p-2.5 rounded-xl flex items-center justify-center transition-all duration-300
                                        ${hasContent
                                            ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95'
                                            : 'bg-white/5 text-slate-600'
                                        }
                                    `}
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4">
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
                    className={`fixed inset-0 z-[100] flex flex-col overflow-hidden transition-colors duration-500 ${view === 'list' ? 'bg-black' : 'bg-neutral-950'}`}
                >
                    {/* Dynamic Background Layer */}
                    <AnimatePresence>
                        {view === 'detail' && selectedTrack && (
                            <motion.div
                                key={`bg-${selectedTrack.id}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1 }}
                                className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
                            >
                                <ThumbnailImage
                                    track={selectedTrack}
                                    className="absolute inset-0 w-full h-full blur-[80px] md:blur-[120px] brightness-[0.35] scale-150 transition-opacity duration-1000"
                                />
                                {/* Optional: Subtle gradient overlay for extra depth */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                            </motion.div>
                        )}
                    </AnimatePresence>

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
