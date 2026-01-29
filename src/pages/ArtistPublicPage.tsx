import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Play, Instagram, Youtube, Music2, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';

interface UserProfile {
    id: string;
    handle: string;
    avatar_url: string | null;
    bio: string | null;
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
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);

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
                    .select('id, handle, avatar_url, bio')
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

    const handlePlayClick = () => {
        setIsPlaying(!isPlaying);
        // Play first track or specific track logic here
        // For now, if there is a track, we can navigate to it or just toggle state
        if (tracks.length > 0) {
            window.location.href = `/track/${tracks[0].id}`;
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

    // Default Images
    const placeholderImage = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1080";
    const displayImage = profile.avatar_url || placeholderImage;
    const mainTrackTitle = tracks.length > 0 ? tracks[0].title : "No tracks released yet";

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-black text-white">
            <div className="absolute z-50 w-full top-0 left-0">
                <Navbar />
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

                {/* Left Gradient Overlay */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.3) 70%, transparent 100%)",
                    }}
                />

                {/* Content Area */}
                <div className="relative z-10 w-full min-h-screen flex items-center pt-20">
                    <div className="w-full px-8 pb-10">
                        <div className="space-y-8">
                            {/* Main Title & Bio */}
                            <div className="space-y-4">
                                <h1 className="text-white text-6xl font-black tracking-tighter drop-shadow-2xl leading-none">
                                    {profile.handle}
                                </h1>

                                <p className="text-white/90 text-lg font-light tracking-wide drop-shadow-lg max-w-[80%] leading-relaxed">
                                    {profile.bio || "No bio available."}
                                </p>
                            </div>

                            {/* Divider line */}
                            <div className="w-12 h-1 bg-white/30 rounded-full" />

                            {/* Music Player Section */}
                            <div className="space-y-5 pt-2">
                                <div>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">
                                        Latest Release
                                    </p>
                                    <p className="text-white text-xl font-medium drop-shadow-lg truncate">
                                        {mainTrackTitle}
                                    </p>
                                </div>

                                {/* Play Button */}
                                <button
                                    onClick={handlePlayClick}
                                    disabled={tracks.length === 0}
                                    className="group flex items-center gap-5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full px-8 py-5 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div
                                        className={`flex items-center justify-center w-14 h-14 rounded-full bg-white text-black transition-transform duration-300 ${isPlaying ? "scale-95" : "group-hover:scale-110"}`}
                                    >
                                        <Play
                                            className="w-6 h-6 ml-1"
                                            fill="currentColor"
                                        />
                                    </div>
                                    <span className="text-white text-lg font-bold tracking-tight">
                                        {isPlaying ? "Now Playing" : "Play Now"}
                                    </span>
                                </button>
                            </div>

                            {/* Social Media Icons (Dummy for now, could generally be added to DB later) */}
                            <div className="flex gap-4 pt-8">
                                <a
                                    href="#"
                                    className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all duration-300 hover:scale-110"
                                    aria-label="Instagram"
                                >
                                    <Instagram className="w-5 h-5" />
                                </a>
                                <a
                                    href="#"
                                    className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all duration-300 hover:scale-110"
                                    aria-label="YouTube"
                                >
                                    <Youtube className="w-5 h-5" />
                                </a>
                                <a
                                    href="#"
                                    className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all duration-300 hover:scale-110"
                                    aria-label="Spotify"
                                >
                                    <Music2 className="w-5 h-5" />
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
