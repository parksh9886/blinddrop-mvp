import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Play, Loader2, Instagram, Youtube, Music2, Globe, Twitter,
    Facebook, Linkedin, MoreHorizontal, X, ArrowUpRight, Plus, Disc3, Link as LinkIcon
} from 'lucide-react';
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

interface ArtistLink {
    id: string;
    platform: string;
    title: string;
    url: string;
    order_index: number;
}

const ArtistPublicPage: React.FC = () => {
    const { handle } = useParams<{ handle: string }>();
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Tracks List State
    const [tracks, setTracks] = useState<Track[]>([]);

    // Links State
    const [artistLinks, setArtistLinks] = useState<ArtistLink[]>([]);
    const [showLinkHub, setShowLinkHub] = useState(false);

    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            if (!handle) {
                console.error('No handle found in URL params');
                setError('No handle specified');
                return;
            }
            try {
                // 1. Fetch User by Handle
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id, handle, display_name, avatar_url, bio, collab_status, collab_types')
                    .eq('handle', handle)
                    .single();

                if (userError || !userData) {
                    throw new Error('Artist not found');
                }
                setProfile(userData);

                // 2. Fetch Tracks
                const { data: tracksData, error: tracksError } = await supabase
                    .from('tracks')
                    .select('id, title, url, platform, created_at')
                    .eq('user_id', userData.id)
                    .order('created_at', { ascending: false });

                if (tracksError) throw tracksError;
                setTracks(tracksData || []);

                // 3. Fetch Artist Links
                const { data: linksData, error: linksError } = await supabase
                    .from('artist_links')
                    .select('*')
                    .eq('user_id', userData.id)
                    .order('order_index', { ascending: true });

                if (linksError) throw linksError;
                setArtistLinks(linksData || []);

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
        const spacerHeight = windowHeight * 0.6;

        let progress = scrollTop / spacerHeight;
        if (progress > 1) progress = 1;
        setScrollProgress(progress);
    };

    // Helper: Get Icon for Platform
    const getIconForPlatform = (platform: string, className = "w-4 h-4") => {
        switch (platform.toLowerCase()) {
            case 'instagram': return <Instagram className={className} />;
            case 'youtube': return <Youtube className={className} />;
            case 'twitter': return <Twitter className={className} />; // Or X icon
            case 'tiktok': return <Music2 className={className} />;
            case 'spotify': return <Disc3 className={className} />;
            case 'soundcloud': return <Music2 className={className} />; // Overlap with Music2
            case 'apple': return <Music2 className={className} />;
            case 'facebook': return <Facebook className={className} />;
            case 'linkedin': return <Linkedin className={className} />;
            case 'website': return <Globe className={className} />;
            default: return <LinkIcon className={className} />;
        }
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

    const isOwner = user?.id === profile.id;
    const placeholderImage = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1080";
    const displayImage = profile.avatar_url || placeholderImage;
    const displayNameText = profile.display_name || profile.handle;
    const isCollabOpen = profile.collab_status === 'OPEN';

    // Styles
    const blurAmount = scrollProgress * 20;
    const brightnessAmount = 100 - (scrollProgress * 60);
    const headerBgOpacity = scrollProgress * 0.9;

    // --- Link Trigger Logic ---
    const linkCount = artistLinks.length;
    let triggerButtons = null;

    if (linkCount === 0) {
        if (isOwner) {
            triggerButtons = (
                <Link to="/profile?tab=links" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all transform hover:scale-110">
                    <Plus className="w-4 h-4" />
                </Link>
            );
        }
    } else if (linkCount <= 3) {
        // Show 1-3 Icons, all open modal
        triggerButtons = artistLinks.map((link) => (
            <button
                key={link.id}
                onClick={() => setShowLinkHub(true)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all transform hover:scale-110"
            >
                {getIconForPlatform(link.platform, "w-3.5 h-3.5")}
            </button>
        ));
    } else {
        // Show Top 3 Icons + More Button
        triggerButtons = (
            <>
                {artistLinks.slice(0, 3).map((link) => (
                    <button
                        key={link.id}
                        onClick={() => setShowLinkHub(true)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all transform hover:scale-110"
                    >
                        {getIconForPlatform(link.platform, "w-3.5 h-3.5")}
                    </button>
                ))}
                <button
                    onClick={() => setShowLinkHub(true)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all transform hover:scale-110"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </>
        );
    }


    return (
        <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-black text-white">
            {/* Navbar */}
            <div className="absolute z-50 w-full top-0 left-0 pointer-events-none">
                <div className="pointer-events-auto">
                    <Navbar />
                </div>
            </div>

            {/* Link Hub Modal Overlay */}
            {showLinkHub && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                    <button
                        onClick={() => setShowLinkHub(false)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="max-w-sm w-full space-y-8 text-center">
                        {/* Hub Header */}
                        <div className="space-y-4 flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl">
                                <img src={displayImage} alt={displayNameText} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{displayNameText}</h2>
                                <p className="text-white/50 text-sm">@{profile.handle}</p>
                            </div>
                        </div>

                        {/* Hub Links */}
                        <div className="space-y-3 w-full">
                            {artistLinks.map((link) => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-between w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-white/70 group-hover:text-white transition-colors">
                                            {getIconForPlatform(link.platform, "w-5 h-5")}
                                        </div>
                                        <span className="font-medium text-white">{link.title}</span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </a>
                            ))}

                            {isOwner && (
                                <Link to="/profile?tab=links" className="flex items-center justify-center p-3 rounded-xl border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-colors text-sm mt-2">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add New Link
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
            </div>

            {/* 2. Scroll Container */}
            <div
                className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth overscroll-y-none"
                onScroll={handleScroll}
            >
                {/* Spacer */}
                <div className="w-full h-[45vh] md:h-[60vh] snap-start bg-transparent pointer-events-none" />

                {/* Main Content */}
                <div className="min-h-screen w-full snap-start flex flex-col">

                    {/* Hero Section with Bottom-Left Content */}
                    <div className="relative h-[85vh] w-full snap-start flex flex-col justify-end">
                        {/* Gradient Overlay for Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

                        <div className="relative z-20 p-8 pb-12 w-full max-w-4xl">
                            <div className="flex flex-col items-start text-left space-y-6">
                                {/* Name & Bio */}
                                <div className="space-y-2">
                                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl leading-none">
                                        {displayNameText}
                                    </h1>
                                    <p className="text-white/70 text-xl font-medium tracking-wide drop-shadow-md max-w-2xl">
                                        {profile.bio || "Artist"}
                                    </p>
                                </div>

                                {/* Status Badge */}
                                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md transition-all duration-300 ${isCollabOpen
                                    ? 'bg-green-500/10'
                                    : 'bg-red-500/10'
                                    }`}>
                                    <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px] ${isCollabOpen
                                        ? 'bg-green-400 shadow-green-400'
                                        : 'bg-red-400 shadow-red-400'
                                        }`} />
                                    <span className={`text-sm font-bold tracking-wide ${isCollabOpen ? 'text-green-300' : 'text-red-300'
                                        }`}>
                                        {isCollabOpen ? 'OPEN FOR COLLAB' : 'NOT TAKING REQUESTS'}
                                    </span>
                                </div>

                                {/* Collab Types */}
                                {isCollabOpen && profile.collab_types && profile.collab_types.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {profile.collab_types.map((type, i) => (
                                            <span key={i} className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 text-sm backdrop-blur-sm transition-colors cursor-default border border-white/5">
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Social Icons */}
                                {triggerButtons && (
                                    <div className="pt-2 flex gap-4">
                                        {triggerButtons}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Track List */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 bg-black/40 backdrop-blur-md min-h-screen">
                        <div className="max-w-2xl mx-auto space-y-2">
                            <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest pl-2 mb-4">Released Tracks</h3>

                            {tracks.map((track, idx) => {
                                let thumbnailUrl = '/placeholder-track.png';
                                if (track.platform === 'youtube') {
                                    const videoId = track.url.split('v=')[1]?.split('&')[0] || track.url.split('/').pop();
                                    if (videoId) thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                                } else if (track.platform === 'soundcloud') {
                                    thumbnailUrl = 'https://a-v2.sndcdn.com/assets/images/default-track-cover-0c30953.png';
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
