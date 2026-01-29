import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Music, User, Play, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useBackground } from '../contexts/BackgroundContext';

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
    const { setBackground } = useBackground();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!handle) {
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

                // Set Global Background
                if (userData.avatar_url) {
                    setBackground(userData.avatar_url);
                } else {
                    setBackground(null);
                }

                // 2. Fetch Tracks
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

        // Cleanup background on unmount
        return () => setBackground(null);
    }, [handle, setBackground]);

    // Helper to extract thumbnail from YouTube URL
    const getThumbnail = (url: string, platform: string) => {
        if (platform === 'youtube') {
            const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
            const match = url.match(regExp);
            const videoId = (match && match[7].length === 11) ? match[7] : null;
            if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }
        return null;
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
    );

    if (error || !profile) return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
            <User className="w-16 h-16 opacity-20" />
            <p className="text-lg">{error || 'Artist not found'}</p>
            <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm">Go Home</Link>
        </div>
    );

    return (
        <div className="relative h-full w-full bg-slate-900 text-white overflow-hidden">
            <div className="absolute top-0 left-0 right-0 z-50">
                <Navbar />
            </div>

            {/* Immersive Background Image */}
            <div className="absolute inset-0 z-0">
                {profile.avatar_url ? (
                    <img
                        src={profile.avatar_url}
                        alt="Background"
                        className="w-full h-full object-cover opacity-80"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-900" />
                )}
                {/* Gradient Overlay - STRONG at bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            </div>

            {/* Bottom Content Area */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-6 pb-12 flex flex-col justify-end min-h-[50%]">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Artist Info */}
                    <div className="mb-8">
                        <h1 className="text-5xl font-black tracking-tighter mb-2 shadow-black drop-shadow-lg">{profile.handle}</h1>
                        {profile.bio && (
                            <p className="text-slate-300 text-sm font-medium leading-relaxed line-clamp-3 drop-shadow-md max-w-[90%]">
                                {profile.bio}
                            </p>
                        )}
                    </div>

                    {/* Featured Track (Latest) */}
                    {tracks.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                <span>Latest Release</span>
                                <span>{tracks.length} Tracks</span>
                            </div>

                            {/* Primary Play Button / Card */}
                            <Link
                                to={`/track/${tracks[0].id}`}
                                className="block group relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                            >
                                {getThumbnail(tracks[0].url, tracks[0].platform) ? (
                                    <img
                                        src={getThumbnail(tracks[0].url, tracks[0].platform)!}
                                        alt={tracks[0].title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                        <Music className="w-12 h-12 text-slate-600" />
                                    </div>
                                )}

                                {/* Play Overlay */}
                                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-6 text-center">
                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Play className="w-6 h-6 text-white fill-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white drop-shadow-lg line-clamp-1 w-full px-4">
                                        {tracks[0].title}
                                    </h3>
                                </div>
                            </Link>

                            {/* More Tracks Horizontal Scroll (If any) */}
                            {tracks.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-4 pt-2 no-scrollbar snap-x">
                                    {tracks.slice(1).map(track => (
                                        <Link
                                            key={track.id}
                                            to={`/track/${track.id}`}
                                            className="snap-start flex-shrink-0 w-20 h-20 rounded-xl bg-slate-800 overflow-hidden relative border border-white/10"
                                        >
                                            {getThumbnail(track.url, track.platform) ? (
                                                <img
                                                    src={getThumbnail(track.url, track.platform)!}
                                                    className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Music className="w-4 h-4 text-slate-500" />
                                                </div>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
                            <p className="text-slate-400">No tracks yet.</p>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-8 flex items-center justify-between">
                        <Link to="/" className="text-xs font-bold text-white/50 hover:text-white transition-colors">
                            BLINDDROP
                        </Link>
                        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                            <Share2 className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ArtistPublicPage;
