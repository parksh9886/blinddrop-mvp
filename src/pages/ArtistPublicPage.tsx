import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Play, Loader2, Pause, Instagram, Youtube, Music2 } from 'lucide-react';
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
    const headerBgOpacity = scrollProgress * 0.9; // 0 -> 0.9

    return (
        <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-black text-white">
            {/* Navbar - Fixed at top z-50 */}
            <div className="absolute z-50 w-full top-0 left-0 pointer-events-none">
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
                        transform: 'scale(1.1)'
                    }}
                />
                {/* Global Gradient Overlay - Always present for text readability in Hero Mode */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
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
                className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth overscroll-y-none"
                onScroll={handleScroll}
            >
                {/* Snap Item 1: Spacer to push content to bottom */}
                <div className="w-full h-[60vh] snap-start bg-transparent pointer-events-none" />

                {/* Snap Item 2: Main Content Area */}
                <div className="min-h-screen w-full snap-start flex flex-col">

                    {/* Sticky Header: Artist Info */}
                    {/* Background turns black only as we scroll (sticky) */}
                    <div
                        className="sticky top-0 z-20 pt-20 pb-6 px-8 border-b border-transparent transition-colors duration-300"
                        style={{
                            backgroundColor: `rgba(0, 0, 0, ${headerBgOpacity})`,
                            borderColor: scrollProgress > 0.8 ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                            backdropFilter: scrollProgress > 0.5 ? 'blur(12px)' : 'none'
                        }}
                    >
                        <div className="max-w-[240px] space-y-6">

                            {/* Header Content Wrapper */}
                            <div className="flex flex-col gap-4">
                                {/* Text Info */}
                                <div className="space-y-2">
                                    <h1 className="text-5xl font-black tracking-tighter text-white drop-shadow-2xl leading-none">
                                        {displayNameText}
                                    </h1>
                                    <p className="text-white/90 text-sm font-medium tracking-wide drop-shadow-lg leading-relaxed">
                                        {profile.bio || "Artist"}
                                    </p>
                                </div>

                                {/* Divider */}
                                <div className="w-8 h-1 bg-white/30 rounded-full" />

                                {/* Controls Row */}
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">
                                            Now Playing
                                        </p>
                                        <p className="text-white text-base font-medium drop-shadow-lg truncate">
                                            {mainTrackTitle}
                                        </p>
                                    </div>

                                    {/* Play Button */}
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

                                    {/* Social Icons (Restored) */}
                                    <div className={`flex gap-3 pt-1 transition-all duration-300 ${scrollProgress > 0.8 ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
                                        <a href="#" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all transform hover:scale-110"><Instagram className="w-3.5 h-3.5" /></a>
                                        <a href="#" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all transform hover:scale-110"><Youtube className="w-3.5 h-3.5" /></a>
                                        <a href="#" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all transform hover:scale-110"><Music2 className="w-3.5 h-3.5" /></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Track List */}
                    {/* Initially invisible/below fold due to spacer, appears on scroll */}
                    {/* Background needs to be semi-transparent black to read text over the blurred image */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 bg-black/40 backdrop-blur-md min-h-screen">
                        <div className="max-w-2xl mx-auto space-y-2">
                            {/* ... Track List Items ... */}
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
