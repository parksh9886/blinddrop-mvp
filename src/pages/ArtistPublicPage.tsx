import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Play, Loader2, Instagram, Youtube, Music2, Globe, Twitter,
    Facebook, Linkedin, X, ArrowUpRight, Plus, Disc3, Link as LinkIcon,
    ChevronLeft, User, MessageSquare
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

// --- Interfaces ---
interface UserProfile {
    id: string;
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    collab_status: 'OPEN' | 'CLOSED' | null;
    collab_types: string[] | null;
}

interface Feedback {
    id: string;
    content: string;
    created_at: string;
    reply: string | null;
    is_unlocked: boolean;
    track_id: string;
}

interface Track {
    id: string;
    title: string;
    url: string;
    platform: 'youtube' | 'soundcloud';
    created_at: string;
    feedbacks?: Feedback[];
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
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // Data State
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [artistLinks, setArtistLinks] = useState<ArtistLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- Overlay State ---
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [overlayView, setOverlayView] = useState<'list' | 'detail'>('list');
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

    // Scroll Progress for Blur
    const [scrollProgress, setScrollProgress] = useState(0);

    // --- Fetch Data ---
    useEffect(() => {
        const fetchData = async () => {
            if (!handle) {
                setError('No handle specified');
                return;
            }
            try {
                // 1. Fetch User
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id, handle, display_name, avatar_url, bio, collab_status, collab_types')
                    .eq('handle', handle)
                    .single();

                if (userError || !userData) throw new Error('Artist not found');
                setProfile(userData);

                // 2. Fetch Tracks (needed for Discography)
                const { data: tracksData, error: tracksError } = await supabase
                    .from('tracks')
                    .select('*')
                    .eq('user_id', userData.id)
                    .order('created_at', { ascending: false });

                if (tracksError) throw tracksError;

                // 2.1 Fetch Feedbacks (Public View logic)
                let tracksWithFeedbacks = tracksData || [];
                if (tracksData && tracksData.length > 0) {
                    const trackIds = tracksData.map(t => t.id);
                    const { data: feedbacksData } = await supabase
                        .from('feedbacks_secure_view')
                        .select('*')
                        .in('track_id', trackIds);

                    tracksWithFeedbacks = tracksData.map(track => ({
                        ...track,
                        feedbacks: feedbacksData?.filter(fb => fb.track_id === track.id) || []
                    }));
                }
                setTracks(tracksWithFeedbacks);

                // 3. Fetch Links
                const { data: linksData, error: linksError } = await supabase
                    .from('artist_links')
                    .select('*')
                    .eq('user_id', userData.id)
                    .order('order_index', { ascending: true });

                if (linksError) throw linksError;
                setArtistLinks(linksData || []);

            } catch (err: any) {
                console.error('Error:', err);
                setError('Artist not found.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [handle]);

    // --- Deep Linking Logic ---
    useEffect(() => {
        const trackId = searchParams.get('track');
        if (trackId && tracks.length > 0) {
            const track = tracks.find(t => t.id === trackId);
            if (track) {
                setSelectedTrack(track);
                setOverlayView('detail');
                setIsOverlayOpen(true);
            }
        }
    }, [searchParams, tracks]);


    // --- Handlers ---
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const windowHeight = window.innerHeight;
        const spacerHeight = windowHeight * 0.6;
        let progress = scrollTop / spacerHeight;
        if (progress > 1) progress = 1;
        setScrollProgress(progress);
    };

    const openDiscography = () => {
        setOverlayView('list');
        setIsOverlayOpen(true);
    };

    const handleTrackClick = (track: Track) => {
        setSelectedTrack(track);
        setOverlayView('detail');
    };

    const handleBackToList = () => {
        setOverlayView('list');
        setSelectedTrack(null);
    };


    // Helper: Icon Map
    const getIconForPlatform = (platform: string, className = "w-5 h-5") => {
        switch (platform.toLowerCase()) {
            case 'instagram': return <Instagram className={className} />;
            case 'youtube': return <Youtube className={className} />;
            case 'twitter': return <Twitter className={className} />;
            case 'spotify': return <Disc3 className={className} />;
            case 'soundcloud': return <Music2 className={className} />;
            case 'website': return <Globe className={className} />;
            case 'facebook': return <Facebook className={className} />;
            case 'linkedin': return <Linkedin className={className} />;
            default: return <LinkIcon className={className} />;
        }
    };

    // --- Styling Vars ---
    const isOwner = user?.id === profile?.id;
    const blurAmount = scrollProgress * 20;
    const brightnessAmount = 100 - (scrollProgress * 60);
    const placeholderImage = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1080";

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-white/50" /></div>;
    if (error || !profile) return <div className="min-h-screen bg-black flex items-center justify-center text-white">{error || 'Error'}</div>;

    const displayImage = profile.avatar_url || placeholderImage;
    const displayName = profile.display_name || profile.handle;
    const isCollabOpen = profile.collab_status === 'OPEN';

    return (
        <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-black text-white">
            <div className="absolute z-50 w-full top-0 left-0 pointer-events-none">
                <div className="pointer-events-auto">
                    <Navbar />
                </div>
            </div>

            {/* Background Layer (Original) */}
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

            {/* Scroll Container (Original) */}
            <div
                className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth overscroll-y-none"
                onScroll={handleScroll}
            >
                {/* Spacer (Original) */}
                <div className="w-full h-[45vh] md:h-[60vh] snap-start bg-transparent pointer-events-none" />

                {/* Section 2: Profile + Links (single dynamic background) */}
                <div
                    className="h-screen w-full snap-start flex flex-col overflow-hidden transition-colors duration-300"
                    style={{ backgroundColor: `rgba(0, 0, 0, ${scrollProgress})` }}
                >

                    {/* Profile Section */}
                    <div className="flex-shrink-0 pt-20 pb-6 px-8 relative z-10">
                        <div className="max-w-[300px] space-y-4">
                            <div className="space-y-1">
                                <h1 className="text-5xl font-bold tracking-tighter text-white drop-shadow-2xl leading-none">
                                    {displayName}
                                </h1>
                                <p className="text-lg text-white/60 font-medium tracking-wide drop-shadow-lg leading-relaxed">
                                    {profile.bio || "Artist"}
                                </p>
                            </div>
                            <div className="space-y-4">
                                {/* Collab Badge */}
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md transition-colors ${isCollabOpen ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                                    <div className={`w-2 h-2 rounded-full ${isCollabOpen ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`} />
                                    <span className="text-xs font-bold tracking-wide">{isCollabOpen ? 'OPEN FOR COLLAB' : 'NOT TAKING REQUESTS'}</span>
                                </div>

                                {/* Collab Types */}
                                {isCollabOpen && profile.collab_types && profile.collab_types.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {profile.collab_types.map((type, i) => (
                                            <span key={i} className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 text-sm font-medium backdrop-blur-sm transition-colors cursor-default">
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Links Container Wrapper */}
                    <div className="flex-1 relative overflow-hidden">
                        {/* Inner Scroll Container */}
                        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-24">
                            <div className="max-w-2xl mx-auto space-y-4">

                                {/* 1. Discography Button */}
                                <button
                                    onClick={openDiscography}
                                    className="group relative w-full p-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-between overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <Disc3 className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-bold text-lg tracking-wide">Discography</span>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </button>

                                {/* 2. Artist Links */}
                                {artistLinks.map((link) => (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 backdrop-blur-md transition-all flex items-center justify-between hover:scale-[1.02]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-white/70 group-hover:text-white transition-colors">
                                                {getIconForPlatform(link.platform)}
                                            </div>
                                            <span className="font-medium text-white/90">{link.title}</span>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
                                    </a>
                                ))}

                                {isOwner && (
                                    <Link to="/profile?tab=links" className="flex items-center justify-center p-3 rounded-xl border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-colors text-sm">
                                        <Plus className="w-4 h-4 mr-2" /> Manage Links
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* --- Discography Overlay (New Logic) --- */}
            <AnimatePresence>
                {isOverlayOpen && (
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
                                <button onClick={handleBackToList} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                    <ChevronLeft className="w-6 h-6 text-white" />
                                </button>
                            ) : (
                                <div className="w-10" /> // Spacer
                            )}

                            <h2 className="text-lg font-bold text-white">
                                {overlayView === 'list' ? 'Discography' : 'Now Playing'}
                            </h2>

                            <button onClick={() => { setIsOverlayOpen(false); setSelectedTrack(null); setOverlayView('list'); }} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {overlayView === 'list' ? (
                                // LIST VIEW
                                <div className="max-w-xl mx-auto space-y-3">
                                    {tracks.map((track) => {
                                        let thumbnailUrl = '/placeholder-track.png';
                                        if (track.platform === 'youtube') {
                                            const videoId = track.url.split('v=')[1]?.split('&')[0] || track.url.split('/').pop();
                                            if (videoId) thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                                        }

                                        return (
                                            <button
                                                key={track.id}
                                                onClick={() => handleTrackClick(track)}
                                                className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-left group"
                                            >
                                                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                                                    <img src={thumbnailUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/0 transition-colors">
                                                        <Play className="w-6 h-6 text-white opacity-80 group-hover:opacity-100" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">{track.title}</h3>
                                                    <p className="text-xs text-white/40 uppercase tracking-wider mt-1">{track.platform}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {tracks.length === 0 && <p className="text-center text-white/30 py-10">No tracks found.</p>}
                                </div>
                            ) : (
                                // DETAIL VIEW
                                selectedTrack && (
                                    <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-right duration-300">
                                        {/* Player */}
                                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
                                            {selectedTrack.platform === 'youtube' ? (
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${selectedTrack.url.split('v=')[1]?.split('&')[0]}?autoplay=1&playsinline=1&theme=dark&color=white`}
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
                                                    src={`https://w.soundcloud.com/player/?url=${selectedTrack.url}&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <h1 className="text-2xl font-bold text-white">{selectedTrack.title}</h1>
                                            <p className="text-sm text-white/40">{new Date(selectedTrack.created_at).toLocaleDateString()}</p>
                                        </div>

                                        <div className="h-px bg-white/10 w-full" />

                                        {/* Feedback Section (Simplified for Overlay) */}
                                        <FeedbackSection track={selectedTrack} />
                                    </div>
                                )
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Sub-Component: Feedback Section (Simplified) ---
const FeedbackSection = ({ track }: { track: Track }) => {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('feedbacks').insert({
                track_id: track.id,
                content: comment
            });
            if (error) throw error;
            alert("Feedback sent!");
            setComment('');
        } catch (err) {
            alert("Error sending feedback");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Secret Feedback
            </h3>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Send anonymous feedback..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                    Send
                </button>
            </form>

            <div className="space-y-4">
                {track.feedbacks?.map((fb, idx) => {
                    // Check readability
                    const isReadable = idx < 3 || fb.is_unlocked;
                    return (
                        <div key={fb.id} className={`p-4 rounded-xl border ${isReadable ? 'bg-white/5 border-white/10' : 'bg-white/5 border-white/5 relative overflow-hidden'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isReadable ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                    <User className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs font-bold text-white/50">Anonymous</span>
                            </div>
                            <p className={`text-sm ${isReadable ? 'text-white/80' : 'text-white/20 blur-sm'}`}>{fb.content}</p>
                            {fb.reply && (
                                <div className="mt-3 pl-3 border-l-2 border-indigo-500">
                                    <p className="text-xs text-indigo-300 font-bold mb-1">Artist Reply</p>
                                    <p className="text-sm text-white/70">{fb.reply}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ArtistPublicPage;
