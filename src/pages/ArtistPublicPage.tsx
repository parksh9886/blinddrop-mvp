import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Music, User, ExternalLink, Play } from 'lucide-react';
import { motion } from 'framer-motion';
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
    );

    if (error || !profile) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
            <User className="w-16 h-16 opacity-20" />
            <p className="text-lg">{error || 'Artist not found'}</p>
            <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm">Go Home</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            <Navbar />
            {/* Header / Profile Section */}
            <div className="pt-20 pb-10 px-6 flex flex-col items-center text-center relative overflow-hidden">

                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10"
                >
                    <div className="w-28 h-28 rounded-full bg-slate-900 border-4 border-slate-800 shadow-2xl overflow-hidden mb-4 mx-auto md:w-32 md:h-32">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.handle} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                <User className="w-12 h-12 text-slate-500" />
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight mb-2">@{profile.handle}</h1>

                    {profile.bio && (
                        <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed whitespace-pre-wrap">
                            {profile.bio}
                        </p>
                    )}
                </motion.div>
            </div>

            {/* Track List Section */}
            <div className="max-w-md mx-auto px-4 space-y-4">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-6">
                    Listen & Feedback
                </h2>

                {tracks.length > 0 ? (
                    tracks.map((track, i) => {
                        const thumbnail = getThumbnail(track.url, track.platform);

                        return (
                            <motion.div
                                key={track.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Link
                                    to={`/track/${track.id}`}
                                    className="group block bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-2 transition-all active:scale-[0.98] backdrop-blur-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Thumbnail / Icon */}
                                        <div className="w-16 h-16 rounded-xl bg-slate-950 flex-shrink-0 overflow-hidden relative border border-slate-800/50">
                                            {thumbnail ? (
                                                <img src={thumbnail} alt="Art" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Music className="w-6 h-6 text-slate-600 group-hover:text-indigo-500 transition-colors" />
                                                </div>
                                            )}
                                            {/* Play Overlay Icon */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play className="w-6 h-6 text-white drop-shadow-md" fill="currentColor" />
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h3 className="font-semibold text-sm text-slate-200 group-hover:text-white truncate transition-colors">
                                                {track.title || 'Untitled Track'}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${track.platform === 'youtube' ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                                                {track.platform === 'youtube' ? 'YouTube' : 'SoundCloud'}
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <div className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                            <ExternalLink className="w-4 h-4 text-slate-500" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="text-center py-10 text-slate-600 text-sm bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                        No tracks released yet.
                    </div>
                )}
            </div>

            {/* Branding Footer */}
            <div className="mt-16 text-center">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-400 text-xs font-medium transition-colors">
                    <Music className="w-3 h-3" />
                    <span>Powered by BlindDrop</span>
                </Link>
            </div>
        </div>
    );
};

export default ArtistPublicPage;
