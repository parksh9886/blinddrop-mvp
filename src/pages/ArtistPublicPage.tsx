import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Play, Loader2, Instagram, Youtube, Music2 } from 'lucide-react';
import Navbar from '../components/Navbar';

interface UserProfile {
    id: string;
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    collab_status: 'OPEN' | 'CLOSED' | null;
    collab_types: string[] | null;
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

    // Tracks List State (Still visible as portfolio)
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
                // 1. Fetch User by Handle (Include collab fields)
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id, handle, display_name, avatar_url, bio, collab_status, collab_types')
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
                setTracks(tracksData || []);

            } catch (err: any) {
                console.error('Error fetching artist data:', err);
                setError('Artist not found.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [handle]);

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
    const displayNameText = profile.display_name || profile.handle;

    // Collab Logic
    const isCollabOpen = profile.collab_status === 'OPEN';

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

            {/* 2. Scroll Container (Snap Wrapper) */}
            <div
                className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth overscroll-y-none"
                onScroll={handleScroll}
            >
                {/* Snap Item 1: Spacer to push content to bottom */}
                <div className="w-full h-[45vh] md:h-[60vh] snap-start bg-transparent pointer-events-none" />

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
                        <div className="max-w-[300px] space-y-6">

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

                                {/* Collab Status Section (Replaces Play Button) */}
                                <div className="space-y-4">

                                    {/* Traffic Light Badge */}
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg ${isCollabOpen
                                        ? 'bg-green-500/10 border-green-400/30'
                                        : 'bg-red-500/10 border-red-400/30'
                                        }`}>
                                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${isCollabOpen
                                            ? 'bg-green-400 shadow-green-400'
                                            : 'bg-red-400 shadow-red-400'
                                            }`} />
                                        <span className={`text-xs font-bold tracking-wide ${isCollabOpen ? 'text-green-300' : 'text-red-300'
                                            }`}>
                                            {isCollabOpen ? 'OPEN FOR COLLAB' : 'NOT TAKING REQUESTS'}
                                        </span>
                                    </div>

                                    {/* Collab Pills (Only if OPEN) */}
                                    {isCollabOpen && profile.collab_types && profile.collab_types.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {profile.collab_types.map((type, i) => (
                                                <span key={i} className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm text-xs font-semibold text-white tracking-wide transition-colors cursor-default">
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Social Icons */}
                                    <div className={`flex gap-3 pt-2 transition-all duration-300 ${scrollProgress > 0.8 ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
                                        <a href="#" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all transform hover:scale-110"><Instagram className="w-3.5 h-3.5" /></a>
                                        <a href="#" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all transform hover:scale-110"><Youtube className="w-3.5 h-3.5" /></a>
                                        <a href="#" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all transform hover:scale-110"><Music2 className="w-3.5 h-3.5" /></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Track List (Portfolio View) */}
                    {/* Simplified list, no play interaction */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 bg-black/40 backdrop-blur-md min-h-screen">
                        <div className="max-w-2xl mx-auto space-y-2">
                            <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest pl-2 mb-4">Released Tracks</h3>

                            {tracks.map((track, idx) => {
                                // Thumbnail Logic
                                let thumbnailUrl = '/placeholder-track.png'; // Fallback
                                if (track.platform === 'youtube') {
                                    const videoId = track.url.split('v=')[1]?.split('&')[0] || track.url.split('/').pop();
                                    if (videoId) thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                                } else if (track.platform === 'soundcloud') {
                                    thumbnailUrl = 'https://a-v2.sndcdn.com/assets/images/default-track-cover-0c30953.png'; // Generic SC
                                }

                                return (
                                    <Link
                                        key={track.id}
                                        to={`/track/${track.id}`}
                                        className="group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                                    >
                                        <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-slate-800">
                                            <img
                                                src={thumbnailUrl}
                                                alt={track.title}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop';
                                                }}
                                            />
                                        </div>

                                        <div className="text-white/40 text-sm font-mono w-6 text-center">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm md:text-base font-medium text-white group-hover:text-indigo-300 transition-colors truncate">
                                                {track.title}
                                            </h3>
                                            <p className="text-xs text-white/40 capitalize">
                                                {track.platform}
                                            </p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-300">
                                            <Play className="w-4 h-4 text-white" />
                                        </div>
                                    </Link>
                                );
                            })}

                            {tracks.length === 0 && (
                                <div className="text-center text-white/30 py-10">
                                    No tracks released yet.
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
