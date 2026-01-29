import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Play, Loader2, Pause } from 'lucide-react';
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

    // State for Tracks List and Scroll Effect
    const [tracks, setTracks] = useState<Track[]>([]);
    const [scrollProgress, setScrollProgress] = useState(0);

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
                setTracks(loadedTracks);

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

    const handleTrackSelect = (track: Track) => {
        setBgmTrack(track);
        setIsPlaying(true);
    };

    // Scroll Handler for Blur Effect
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const windowHeight = window.innerHeight;
        // Calculate progress based on spacer height (approx 60vh)
        const spacerHeight = windowHeight * 0.6;

        let progress = scrollTop / spacerHeight;
        if (progress > 1) progress = 1;
        setScrollProgress(progress);
    };

    // Helper to generate embed URL for BGM
    const getBgmEmbedUrl = (track: Track): string | null => {
        if (!track.url) return null;

        if (track.platform === 'youtube') {
            const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
            const match = track.url.match(regExp);
            const videoId = (match && match[7].length === 11) ? match[7] : null;

            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&fs=0&modestbranding=1`;
            }
            return null;
        }

        if (track.platform === 'soundcloud') {
            const encodedUrl = encodeURIComponent(track.url);
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
    const displayNameText = profile.display_name || profile.handle;

    // Dynamic Styles based on scroll
    // Blur: 0 -> 24px (xl is 24px)
    // Brightness: 100% -> 40%
    const blurAmount = scrollProgress * 20;
    const brightnessAmount = 100 - (scrollProgress * 60); // Down to 40%

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black text-white">
            {/* Navbar - Fixed at top z-50 */}
            <div className="absolute z-50 w-full top-0 left-0 pointer-events-none">
                {/* Wrap Navbar in pointer-events-auto if it has interactive elements, 
                     but standard pointer-events-none lets clicks pass through to background/scroll 
                     if navbar is transparent. Assuming Navbar handles its own pointer events. */}
                <div className="pointer-events-auto">
                    <Navbar />
                </div>
            </div>

            {/* 1. Fixed Background */}
            <div className="fixed inset-0 z-0">
                <img
                    src={displayImage}
                    alt="Background"
                    className="w-full h-full object-cover transition-all duration-100 ease-out"
                    style={{
                        filter: `blur(${blurAmount}px) brightness(${brightnessAmount}%)`,
                        transform: 'scale(1.1)' // Slight scale to avoid blur edge artifacts
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
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

            {/* 2. Scroll Container (Snap Wrapper) */}
            <div
                className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth"
                onScroll={handleScroll}
            >
                {/* Snap Item 1: Invisible Spacer (To push content to bottom effectively) */}
                <div className="w-full h-[60vh] snap-start bg-transparent pointer-events-none" />

                {/* Snap Item 2: Main Content Area */}
                <div className="h-screen w-full snap-start flex flex-col bg-black/40 backdrop-blur-sm">

                    {/* Sticky Header: Artist Info */}
                    <div className="sticky top-0 z-20 pt-20 pb-6 px-8 bg-gradient-to-b from-black/90 via-black/80 to-transparent backdrop-blur-md border-b border-white/5">
                        <div className="max-w-2xl mx-auto space-y-6">

                            {/* Header Content Wrapper */}
                            <div className="flex flex-col gap-4">
                                {/* Text Info */}
                                <div className="space-y-2">
                                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-md">
                                        {displayNameText}
                                    </h1>
                                    <p className="text-white/80 text-sm md:text-base font-medium">
                                        {profile.bio || "Artist"}
                                    </p>
                                </div>

                                {/* Controls Row */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">
                                            Latest Release
                                        </span>
                                        <span className="text-white text-base font-medium truncate max-w-[200px]">
                                            {mainTrackTitle}
                                        </span>
                                    </div>

                                    {/* Play Button */}
                                    <button
                                        onClick={handlePlayClick}
                                        disabled={!bgmTrack}
                                        className="flex items-center gap-3 bg-white text-black px-5 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-4 h-4 fill-current" />
                                        ) : (
                                            <Play className="w-4 h-4 fill-current ml-0.5" />
                                        )}
                                        <span className="text-sm font-bold">
                                            {isPlaying ? "Pause" : "Play"}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Track List */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
                        <div className="max-w-2xl mx-auto space-y-2">
                            {tracks.map((track, idx) => (
                                <div
                                    key={track.id}
                                    onClick={() => handleTrackSelect(track)}
                                    className={`group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${bgmTrack?.id === track.id && isPlaying
                                        ? 'bg-white/20 border-white/30 shadow-inner' // Active style
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="text-white/40 text-sm font-mono w-6 text-center">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-sm md:text-base font-medium truncate transition-colors ${bgmTrack?.id === track.id && isPlaying ? 'text-indigo-400' : 'text-white'
                                            }`}>
                                            {track.title}
                                        </h3>
                                        <p className="text-xs text-white/40 capitalize">
                                            {track.platform}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="w-4 h-4 text-white" />
                                    </div>
                                    {bgmTrack?.id === track.id && isPlaying && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    )}
                                </div>
                            ))}

                            {tracks.length === 0 && (
                                <div className="text-center text-white/30 py-10">
                                    No tracks available.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtistPublicPage;
