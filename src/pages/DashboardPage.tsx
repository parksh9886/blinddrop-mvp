import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { Plus, Loader2, Music, ExternalLink, Trash2, Link as LinkIcon, AlertCircle, MessageSquare, ChevronDown, ChevronUp, CheckCircle2, User, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Feedback {
    id: string;
    content: string;
    created_at: string;
    reply: string | null;
    is_unlocked: boolean;
}

interface Track {
    id: string;
    title: string;
    url: string;
    platform: 'youtube' | 'soundcloud';
    created_at: string;
    feedbacks: Feedback[];
}

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [handle, setHandle] = useState<string | null>(null);
    const [newTrackUrl, setNewTrackUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);

    const fetchData = async () => {
        if (!user) return;
        try {
            // Fetch User Handle
            const { data: userData } = await supabase
                .from('users')
                .select('handle')
                .eq('id', user.id)
                .single();

            if (userData) setHandle(userData.handle);

            // Fetch Tracks
            const { data: tracksData, error: tracksError } = await supabase
                .from('tracks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (tracksError) throw tracksError;

            if (tracksData && tracksData.length > 0) {
                const trackIds = tracksData.map(t => t.id);

                // Fetch Feedbacks from Secure View
                const { data: feedbacksData, error: feedbacksError } = await supabase
                    .from('feedbacks_secure_view')
                    .select('*')
                    .in('track_id', trackIds)
                    .order('created_at', { ascending: false });

                if (feedbacksError) throw feedbacksError;

                // Merge feedbacks into tracks
                const tracksWithFeedbacks = tracksData.map(track => ({
                    ...track,
                    feedbacks: feedbacksData?.filter(fb => fb.track_id === track.id) || []
                }));

                setTracks(tracksWithFeedbacks);
            } else {
                setTracks([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleAddTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTrackUrl) return;

        setSubmitting(true);
        setErrorMsg('');

        // Simple validation & platform detection
        let platform: 'youtube' | 'soundcloud' | null = null;
        if (newTrackUrl.includes('youtube.com') || newTrackUrl.includes('youtu.be')) platform = 'youtube';
        else if (newTrackUrl.includes('soundcloud.com')) platform = 'soundcloud';

        if (!platform) {
            setErrorMsg('Only YouTube and SoundCloud links are supported.');
            setSubmitting(false);
            return;
        }

        try {
            // Insert track
            const { data, error } = await supabase
                .from('tracks')
                .insert({
                    user_id: user.id,
                    url: newTrackUrl,
                    platform: platform,
                    title: 'Untitled Track', // We can fetch title later or ask user input
                })
                .select()
                .single();

            if (error) throw error;

            setTracks([data, ...tracks]);
            setNewTrackUrl('');
            setToast({ message: 'Track added successfully!', type: 'success' });
        } catch (error: any) {
            console.error('Error adding track:', error);
            setErrorMsg(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (trackId: string) => {
        if (!confirm('Are you sure you want to delete this track?')) return;
        try {
            const { error } = await supabase
                .from('tracks')
                .delete()
                .eq('id', trackId);

            if (error) {
                console.error('Supabase delete error:', error);
                setToast({ message: 'Failed to delete track. Check permissions.', type: 'error' });
                return; // Do not update state if delete failed
            }

            setTracks(tracks.filter(t => t.id !== trackId));
            setToast({ message: 'Track deleted.', type: 'success' });
        } catch (err: any) {
            console.error('Error deleting track:', err);
            setToast({ message: 'An unexpect error occurred.', type: 'error' });
        }
    };

    const handleReply = async (feedbackId: string, trackId: string, replyContent: string) => {
        try {
            console.log('Attempting to reply to feedback:', feedbackId, 'with:', replyContent);
            const { error } = await supabase
                .from('feedbacks')
                .update({ reply: replyContent })
                .eq('id', feedbackId)
                .select(); // Ensure row is returned to confirm update

            if (error) {
                console.error('Supabase Reply Update Error:', error);
                throw error;
            }

            // Update State only after successful DB update
            setTracks(prevTracks => prevTracks.map(t => {
                if (t.id === trackId) {
                    return {
                        ...t,
                        feedbacks: t.feedbacks.map(f => f.id === feedbackId ? { ...f, reply: replyContent } : f)
                    };
                }
                return t;
            }));

            setToast({ message: 'Reply saved successfully!', type: 'success' });
        } catch (error: any) {
            console.error('Error saving reply:', error);
            setToast({ message: `Failed to save reply: ${error.message || 'Unknown error'}`, type: 'error' });
        }
    };

    const handleUnlock = async (feedbackId: string, trackId: string) => {
        try {
            console.log('Attempting to unlock feedback:', feedbackId);
            const { error } = await supabase
                .from('feedbacks')
                .update({ is_unlocked: true })
                .eq('id', feedbackId)
                .select();

            if (error) {
                console.error('Supabase Unlock Update Error:', error);
                throw error;
            }

            // Update State only after successful DB update
            setTracks(prevTracks => prevTracks.map(t => {
                if (t.id === trackId) {
                    return {
                        ...t,
                        feedbacks: t.feedbacks.map(f => f.id === feedbackId ? { ...f, is_unlocked: true } : f)
                    };
                }
                return t;
            }));

            setToast({ message: 'Feedback unlocked!', type: 'success' });
        } catch (error: any) {
            console.error('Error unlocking feedback:', error);
            setToast({ message: `Failed to unlock feedback: ${error.message || 'Unknown error'}`, type: 'error' });
        }
    };

    const handleCopyLink = (trackId: string) => {
        // Construct public URL. Using /track/:trackId
        const url = `${window.location.origin}/track/${trackId}`;
        navigator.clipboard.writeText(url).then(() => {
            setToast({ message: 'Link copied to clipboard!', type: 'success' });
        }).catch(() => {
            setToast({ message: 'Failed to copy link.', type: 'error' });
        });
    };

    if (loading) return (
        <Layout>
            <div className="flex justify-center pt-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        </Layout>
    );

    return (
        <Layout>
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl transition-all z-50 flex items-center gap-2 ${toast.type === 'success' ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <LinkIcon className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column: Stats or Profile Summary could go here */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/20 p-6 rounded-2xl">
                        <h2 className="text-lg font-bold mb-2">Welcome Back!</h2>
                        <p className="text-slate-400 text-sm mb-4">Start collecting feedback on your latest demos.</p>
                        <div className="text-2xl font-bold">{tracks.length} <span className="text-sm font-normal text-slate-500">tracks uploaded</span></div>

                        {handle && (
                            <button
                                onClick={() => {
                                    const url = `${window.location.origin}/u/${handle}`;
                                    navigator.clipboard.writeText(url);
                                    setToast({ message: 'Profile link copied!', type: 'success' });
                                }}
                                className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
                            >
                                <LinkIcon className="w-4 h-4" />
                                Copy Profile Link
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Column: Tracks List & Add Form */}
                <div className="md:col-span-2 space-y-8">
                    {/* Add Track Form */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-indigo-400" /> Add New Track
                        </h3>
                        <form onSubmit={handleAddTrack} className="flex flex-col gap-4">
                            <div className="relative">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="url"
                                    placeholder="Paste YouTube or SoundCloud link..."
                                    value={newTrackUrl}
                                    onChange={(e) => setNewTrackUrl(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600 transition-all"
                                    required
                                />
                            </div>
                            {errorMsg && (
                                <div className="text-red-400 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> {errorMsg}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="self-end px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Adding...' : 'Add Track'}
                            </button>
                        </form>
                    </div>

                    {/* Track List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Your Tracks</h3>
                        {tracks.length === 0 ? (
                            <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                                <Music className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p>No tracks yet. Add your first one above!</p>
                            </div>
                        ) : (
                            tracks.map(track => (
                                <div key={track.id} className="group bg-slate-900/50 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-4 transition-all hover:bg-slate-900 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
                                                <Music className="w-6 h-6 text-slate-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-white line-clamp-1">{track.title || track.url}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${track.platform === 'youtube' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                        {track.platform}
                                                    </span>
                                                    <span className="text-xs text-slate-600">
                                                        {new Date(track.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/u/${track.id}`}
                                                className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                                                title="View Public Page"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(track.id)}
                                                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                                title="Delete Track"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Feedback Section Toggle */}
                                    <div className="mt-4 flex items-center justify-between border-t border-slate-800/50 pt-3">
                                        <button
                                            onClick={() => handleCopyLink(track.id)}
                                            className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-400 transition-colors"
                                        >
                                            <LinkIcon className="w-3 h-3" />
                                            <span className="truncate max-w-[150px] md:max-w-none">Copy Public Link</span>
                                        </button>

                                        <button
                                            onClick={() => setExpandedTrackId(expandedTrackId === track.id ? null : track.id)}
                                            className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-full"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            View Feedbacks ({track.feedbacks?.length || 0})
                                            {expandedTrackId === track.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>

                                    {/* Accordion Content */}
                                    <AnimatePresence>
                                        {expandedTrackId === track.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-4 space-y-3">
                                                    {track.feedbacks && track.feedbacks.length > 0 ? (
                                                        (() => {
                                                            // Logic: Sort feedbacks.
                                                            // 1. Identify "Readable" items: Top 3 (by date) OR is_unlocked.
                                                            // 2. Sort: Readable first, then Locked. Within groups, date desc.

                                                            // Original list is already date desc from DB query, but let's be safe.
                                                            const sortedByDate = [...track.feedbacks].sort((a, b) =>
                                                                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                                            );

                                                            // Determine Readable status based on ORIGINAL index in date-sorted list
                                                            const processedFeedbacks = sortedByDate.map((fb, index) => ({
                                                                ...fb,
                                                                isReadable: index < 3 || fb.is_unlocked
                                                            }));

                                                            // Sort: Readable Top
                                                            const displayFeedbacks = processedFeedbacks.sort((a, b) => {
                                                                if (a.isReadable === b.isReadable) {
                                                                    // If both readable or both locked, sort by date desc
                                                                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                                                                }
                                                                // Readable first (true > false)
                                                                return a.isReadable ? -1 : 1;
                                                            });

                                                            return displayFeedbacks.map((fb) => (
                                                                <div key={fb.id} className={`rounded-xl p-4 border transition-all ${fb.isReadable ? 'bg-slate-950 border-slate-800' : 'bg-slate-900/50 border-slate-800/50 relative overflow-hidden'}`}>

                                                                    {/* Header */}
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${fb.isReadable ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : 'bg-slate-800'}`}>
                                                                            <User className="w-3 h-3" />
                                                                        </div>
                                                                        <span className={`text-xs font-bold ${fb.isReadable ? 'text-slate-400' : 'text-slate-500'}`}>Anonymous Listener</span>
                                                                        <span className={`text-[10px] ml-auto ${fb.isReadable ? 'text-slate-600' : 'text-slate-700'}`}>{new Date(fb.created_at).toLocaleDateString()}</span>
                                                                    </div>

                                                                    {/* Content */}
                                                                    <p className={`text-sm leading-relaxed mb-4 transition-all ${fb.isReadable ? 'text-slate-300' : 'text-slate-500 blur-md select-none pointer-events-none'}`}>
                                                                        {fb.content}
                                                                    </p>

                                                                    {/* Action Section */}
                                                                    {fb.isReadable ? (
                                                                        // READABLE: Show Reply Logic
                                                                        fb.reply ? (
                                                                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 ml-4 relative">
                                                                                <div className="absolute -left-4 top-4 w-4 h-[1px] bg-indigo-500/30"></div>
                                                                                <div className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-1">
                                                                                    <CheckCircle2 className="w-3 h-3" /> Artist Reply
                                                                                </div>
                                                                                <p className="text-xs text-indigo-200">{fb.reply}</p>
                                                                            </div>
                                                                        ) : (
                                                                            <form
                                                                                onSubmit={(e) => {
                                                                                    e.preventDefault();
                                                                                    const form = e.target as HTMLFormElement;
                                                                                    const input = form.elements.namedItem('reply') as HTMLInputElement;
                                                                                    handleReply(fb.id, track.id, input.value);
                                                                                }}
                                                                                className="ml-4 flex gap-2"
                                                                            >
                                                                                <input
                                                                                    name="reply"
                                                                                    type="text"
                                                                                    placeholder="Write a reply..."
                                                                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                                                                    required
                                                                                />
                                                                                <button
                                                                                    type="submit"
                                                                                    className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                                                                                >
                                                                                    Reply
                                                                                </button>
                                                                            </form>
                                                                        )
                                                                    ) : (
                                                                        // LOCKED: Show Unlock Button
                                                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                                                            <button
                                                                                onClick={() => handleUnlock(fb.id, track.id)}
                                                                                className="flex items-center gap-2 bg-slate-800/90 hover:bg-indigo-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg border border-slate-700 hover:border-indigo-500 group-hover:scale-105"
                                                                            >
                                                                                <Lock className="w-3 h-3" />
                                                                                Unlock Feedback
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ));
                                                        })()
                                                    ) : (
                                                        <div className="text-center py-6 text-slate-500 text-sm bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                                                            No feedback yet. Share your link!
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
