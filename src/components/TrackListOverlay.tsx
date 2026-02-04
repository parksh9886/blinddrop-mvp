import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, Play, Link as LinkIcon, Music } from 'lucide-react';

interface Track {
    id: string;
    title: string;
    url: string;
    platform: 'youtube' | 'soundcloud';
    created_at: string;
    order_index?: number;
}

interface TrackListOverlayProps {
    isOpen: boolean;
    overlayView: 'list' | 'detail';
    tracks: Track[];
    onTrackPlay: (track: Track) => void;
    artistName?: string;
    copyTrackLink: (trackId: string, e?: React.MouseEvent) => void;
    onClose: () => void;
    onBackToList: () => void;
    children?: React.ReactNode;
}

const TrackListOverlay: React.FC<TrackListOverlayProps> = ({
    isOpen,
    overlayView,
    tracks,
    onTrackPlay,
    artistName,
    copyTrackLink,
    onClose,
    onBackToList,
    children
}) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const getThumbnailUrl = (track: Track) => {
        if (track.platform === 'youtube') {
            const videoId = track.url.split('v=')[1]?.split('&')[0] || track.url.split('/').pop();
            if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }
        return null;
    };

    const handleItemClick = (trackId: string) => {
        setSelectedId(prev => (prev === trackId ? null : trackId));
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
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[100] bg-slate-950 flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                        {overlayView === 'detail' ? (
                            <button onClick={onBackToList} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <ChevronLeft className="w-6 h-6 text-white" />
                            </button>
                        ) : (
                            <div className="w-10" />
                        )}

                        <h2 className="text-lg font-bold text-white">
                            {overlayView === 'list' ? 'Discography' : 'Now Playing'}
                        </h2>

                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {overlayView === 'list' ? (
                            <div className="grid grid-cols-2 gap-1 md:gap-2 max-w-4xl mx-auto">
                                {sortedTracks.map((track, index) => {
                                    const thumb = getThumbnailUrl(track);
                                    const isSelected = selectedId === track.id;
                                    const fallbackGradient = fallbacks[index % fallbacks.length];

                                    return (
                                        <div
                                            key={track.id}
                                            onClick={() => handleItemClick(track.id)}
                                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group shadow-lg ring-1 ring-white/5"
                                        >
                                            {/* Base Image / Gradient */}
                                            {thumb ? (
                                                <img
                                                    src={thumb}
                                                    alt={track.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center p-4 relative`}>
                                                    <span className="text-7xl font-black text-white/10 select-none uppercase absolute">
                                                        {track.title.charAt(0)}
                                                    </span>
                                                    <h3 className="text-white font-bold text-center text-sm md:text-base leading-tight drop-shadow-lg line-clamp-3 relative z-10">
                                                        {track.title}
                                                    </h3>
                                                </div>
                                            )}

                                            {/* Tap Overlay (Selected State) */}
                                            <div
                                                className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center ${isSelected ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
                                                        onTrackPlay(track);
                                                    }}
                                                    className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform"
                                                >
                                                    <Play className="w-7 h-7 md:w-8 md:h-8 text-black ml-1 fill-black" />
                                                </button>

                                                {/* Copy Link Accessory */}
                                                <button
                                                    onClick={(e) => copyTrackLink(track.id, e)}
                                                    className="absolute bottom-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                                                >
                                                    <LinkIcon className="w-4 h-4 text-white/70" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* DETAIL VIEW (Passthrough from parent) */
                            <div className="max-w-xl mx-auto">
                                {children}
                            </div>
                        )}

                        {overlayView === 'list' && sortedTracks.length === 0 && (
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
