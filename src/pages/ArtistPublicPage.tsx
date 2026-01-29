import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Play, Instagram, Youtube, Music2, Loader2, Pause } from 'lucide-react';
import Navbar from '../components/Navbar';

interface UserProfile {
    id: string;
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null; // This now holds the Roles (e.g. "Singer · Producer")
    main_track_id: string | null;
}

interface Track {
    id: string;
    title: string;
    url: string;
    platform: 'youtube' | 'soundcloud';
    created_at: string;
}

const ArtistPublicPage: React.FC = () => {
    const { handle } = useParams<{ handle: string }>();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // BGM State
    const [isPlaying, setIsPlaying] = useState(false);
    const [bgmTrack, setBgmTrack] = useState<Track | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!handle) {
                console.error('No handle found in URL params');
                setError('No handle specified');
                return;
            }
            try {
                // 1. Fetch User by Handle (Include main_track_id and display_name)
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id, handle, display_name, avatar_url, bio, main_track_id')
                    .eq('handle', handle)
                    .single();

                if (userError || !userData) {
                    throw new Error('Artist not found');
                }
                setProfile(userData);

                // 2. Fetch Tracks for this user
                const { data: tracksData, error: tracksError } = await supabase
                    .from('tracks')
                    .select('id, title, url, platform, created_at')
                    .eq('user_id', userData.id)
                    .order('created_at', { ascending: false });

                if (tracksError) throw tracksError;

                const loadedTracks = tracksData || [];

                // Determine BGM Track
                if (loadedTracks.length > 0) {
                    if (userData.main_track_id) {
                        const main = loadedTracks.find(t => t.id === userData.main_track_id);
                        setBgmTrack(main || loadedTracks[0]);
                    } else {
                        setBgmTrack(loadedTracks[0]);
                    }
                }

            } catch (err: any) {
                console.error('Error fetching artist data:', err);
                setError('Artist not found.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [handle]);

    const handlePlayClick = () => {
        if (!bgmTrack) return;
        setIsPlaying(!isPlaying);
    };

    // Helper to generate embed URL for BGM
    const getBgmEmbedUrl = (track: Track): string | null => {
        if (!track.url) return null;

        if (track.platform === 'youtube') {
            const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
            const match = track.url.match(regExp);
            const videoId = (match && match[7].length === 11) ? match[7] : null;

            if (videoId) {
                // autoplay=1 is key. modestbranding/controls=0 to keep it lightweight/clean if visible (though hidden).
                return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&fs=0&modestbranding=1`;
            }
            return null;
        }

        if (track.platform === 'soundcloud') {
            const encodedUrl = encodeURIComponent(track.url);
            // auto_play=true
            return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%234f46e5&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
        }

        return null;
    };


    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        </div>
    );

    if (error || !profile) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white/50 gap-4">
            <p className="text-lg">{error || 'Artist not found'}</p>
            <Link to="/" className="text-white hover:text-white/80 text-sm underline">Go Home</Link>
        </div>
    );

    // Default Images
    const placeholderImage = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1080";
    const displayImage = profile.avatar_url || placeholderImage;
    const mainTrackTitle = bgmTrack?.title || "No tracks released yet";
    const displayNameText = profile.display_name || profile.handle; // Fallback to handle

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-black text-white">
            <div className="absolute z-50 w-full top-0 left-0">
                <Navbar />
            </div>

            {/* Hidden BGM Player */}
            <div className="absolute w-1 h-1 overflow-hidden opacity-0 pointer-events-none">
                {isPlaying && bgmTrack && getBgmEmbedUrl(bgmTrack) && (
                    <iframe
                        src={getBgmEmbedUrl(bgmTrack)!}
                        allow="autoplay; encrypted-media"
                        title="BGM Player"
                    />
                )}
            </div>

            {/* PC: Background Blur */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute inset-0">
                    <img
                        src={displayImage}
                        alt="Background blur"
                        className="w-full h-full object-cover blur-3xl scale-110 opacity-60"
                    />
                </div>
            </div>

            {/* Mobile Fixed Container */}
            <div className="relative mx-auto w-full max-w-md min-h-screen bg-black md:bg-transparent shadow-2xl">
                {/* Main Background Image - Visible on Mobile/Container */}
                <div className="absolute inset-0">
                    <img
                        src={displayImage}
                        alt="Musician background"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Left Gradient Overlay - Stronger at bottom for text visibility */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.9) 90%, black 100%)",
                    }}
                />

                {/* Content Area - Bottom Aligned */}
                <div className="relative z-10 w-full min-h-screen flex flex-col justify-end">
                    <div className="w-full px-8 pb-24">
                        {/* Constrained Width Container to match user request (Red Box) */}
                        <div className="space-y-6 max-w-[240px]">
                            {/* Main Title & Bio */}
                            <div className="space-y-2">
                                <h1 className="text-white text-5xl font-black tracking-tighter drop-shadow-2xl leading-none break-words">
                                    {displayNameText}
                                </h1>

                                {/* Roles (formerly Bio) */}
                                <p className="text-white/90 text-sm font-medium tracking-wide drop-shadow-lg leading-relaxed">
                                    {profile.bio || "Artist"}
                                </p>
                            </div>

                            {/* Divider line */}
                            <div className="w-8 h-1 bg-white/30 rounded-full" />

                            {/* Music Player Section */}
                            <div className="space-y-4 pt-1">
                                <div>
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">
                                        Latest Release
                                    </p>
                                    <p className="text-white text-base font-medium drop-shadow-lg truncate">
                                        {mainTrackTitle}
                                    </p>
                                </div>

                                {/* Play Button - Compact Width */}
                                <button
                                    onClick={handlePlayClick}
                                    disabled={!bgmTrack}
                                    className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full pl-2 pr-6 py-2 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
                                >
                                    <div
                                        className={`flex items-center justify-center w-10 h-10 rounded-full bg-white text-black transition-transform duration-300 ${isPlaying ? "scale-95" : "group-hover:scale-110"}`}
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-4 h-4" fill="currentColor" />
                                        ) : (
                                            <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                                        )}
                                    </div>
                                    <span className="text-white text-sm font-bold tracking-tight text-left">
                                        {isPlaying ? "Pause" : "Play Now"}
                                    </span>
                                </button>
                            </div>

                            {/* Social Media Icons */}
                            <div className="flex gap-3 pt-1">
                                <a
                                    href="#"
                                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all duration-300 hover:scale-110"
                                    aria-label="Instagram"
                                >
                                    <Instagram className="w-3.5 h-3.5" />
                                </a>
                                <a
                                    href="#"
                                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all duration-300 hover:scale-110"
                                    aria-label="YouTube"
                                >
                                    <Youtube className="w-3.5 h-3.5" />
                                </a>
                                <a
                                    href="#"
                                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all duration-300 hover:scale-110"
                                    aria-label="Spotify"
                                >
                                    <Music2 className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtistPublicPage;
