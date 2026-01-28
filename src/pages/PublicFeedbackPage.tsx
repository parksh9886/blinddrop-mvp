import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Send, CheckCircle2, Loader2, AlertCircle, MessageSquare, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

interface Feedback {
    id: string;
    content: string;
    created_at: string;
    reply: string | null;
}

interface Track {
    id: string;
    url: string;
    title: string;
    user_id: string;
    platform: 'youtube' | 'soundcloud';
}

const PublicFeedbackPage: React.FC = () => {
    const { trackId } = useParams<{ trackId: string }>();
    const [track, setTrack] = useState<Track | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

    // Fetch Track & Feedbacks
    useEffect(() => {
        const fetchData = async () => {
            if (!trackId) return;
            try {
                // Fetch Track
                const { data: trackData, error: trackError } = await supabase
                    .from('tracks')
                    .select('*')
                    .eq('id', trackId)
                    .single();

                if (trackError) throw trackError;
                setTrack(trackData);

                // Fetch Feedbacks
                const { data: feedbackData, error: feedbackError } = await supabase
                    .from('feedbacks')
                    .select('*')
                    .eq('track_id', trackId)
                    .order('created_at', { ascending: false });

                if (feedbackError) throw feedbackError;
                setFeedbacks(feedbackData || []);

            } catch (err: any) {
                console.error('Error loading data:', err);
                setError('Track not found or deleted.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [trackId, submitted]);

    // Helper: Convert user URL to Embed URL
    const getEmbedUrl = (track: Track): string | null => {
        if (!track.url) return null;

        if (track.platform === 'youtube') {
            // Regex to match YouTube Video IDs from various formats:
            // youtube.com/watch?v=VIDEO_ID
            // youtu.be/VIDEO_ID
            // music.youtube.com/watch?v=VIDEO_ID
            // youtube.com/embed/VIDEO_ID
            const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
            const match = track.url.match(regExp);
            const videoId = (match && match[7].length === 11) ? match[7] : null;

            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
            }
            return null;
        }

        if (track.platform === 'soundcloud') {
            const encodedUrl = encodeURIComponent(track.url);
            return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%234f46e5&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!track || !feedback.trim()) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('feedbacks')
                .insert({
                    track_id: track.id,
                    content: feedback,
                });

            if (error) throw error;
            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting feedback:', err);
            alert('Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
    if (error || !track) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">{error || 'Track not found'}</div>;

    const embedUrl = getEmbedUrl(track);

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center pt-24 pb-12 px-4">
            <Navbar />

            <div className="w-full max-w-2xl space-y-8">
                {/* Native Iframe Player */}
                <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
                    <div className="aspect-video bg-black relative w-full">
                        {embedUrl ? (
                            <iframe
                                src={embedUrl}
                                title={track.title || "Music Player"}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute top-0 left-0 w-full h-full"
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                                <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
                                <p>Invalid URL format. Unable to load player.</p>
                                <p className="text-xs mt-2 opacity-50 break-all">{track.url}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-900">
                        <h1 className="text-xl md:text-2xl font-bold mb-2 line-clamp-2">{track.title || 'Untitled Track'}</h1>
                        <p className="text-indigo-400 text-sm font-medium">
                            🎵 Please listen to the track above before leaving feedback.
                        </p>
                    </div>
                </div>

                {/* Feedback Form */}
                <div className="relative z-10">
                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center"
                        >
                            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Feedback Sent!</h2>
                            <p className="text-slate-400">Your honest feedback has been anonymously delivered to the artist.</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 transition-all">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Your Honest Feedback <span className="text-slate-500 font-normal">(Anonymous)</span>
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="What did you think? Be honest, they can handle it."
                                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600 resize-none transition-all"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 my-button-glow"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                Send Feedback
                            </button>
                        </form>
                    )}
                </div>

                {/* Community Feedbacks */}
                <div className="space-y-6 pb-12 w-full max-w-2xl relative z-10">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                        Community Feedback
                    </h3>

                    <div className="space-y-4">
                        {feedbacks.length > 0 ? (
                            (() => {
                                // Sort: Replied (Top) -> Waiting (Bottom). Both desc by date (already fetched in desc order).
                                const replied = feedbacks.filter(f => f.reply);
                                const waiting = feedbacks.filter(f => !f.reply);
                                const sortedFeedbacks = [...replied, ...waiting];

                                return sortedFeedbacks.map((fb) => {
                                    const isLocked = !fb.reply;
                                    return (
                                        <div key={fb.id} className="relative group">
                                            <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 transition-all ${isLocked ? 'select-none' : ''}`}>
                                                {/* Header */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className={`font-bold text-sm ${isLocked ? 'text-slate-500' : 'text-slate-300'}`}>Anonymous Listener</div>
                                                        <div className="text-xs text-slate-600">{new Date(fb.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <p className={`text-sm leading-relaxed ${isLocked ? 'text-slate-600 blur-md pointer-events-none' : 'text-slate-300'}`}>
                                                    {fb.content}
                                                </p>

                                                {/* Artist Reply */}
                                                {fb.reply && (
                                                    <div className="mt-4 pt-4 border-t border-slate-800/50">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center mt-0.5">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-indigo-400 mb-1">Artist Reply</div>
                                                                <p className="text-sm text-indigo-200/80">{fb.reply}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Lock Overlay */}
                                            {isLocked && (
                                                <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                                                    <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-xl px-5 py-3 flex items-center gap-3 shadow-2xl">
                                                        <Lock className="w-4 h-4 text-indigo-500" />
                                                        <span className="text-sm font-medium text-slate-300">Waiting for artist's reply to reveal</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()
                        ) : (
                            <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                                Be the first to leave feedback!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .my-button-glow {
                    box-shadow: 0 0 20px -5px rgba(79, 70, 229, 0.5);
                }
                .my-button-glow:hover {
                    box-shadow: 0 0 30px -5px rgba(79, 70, 229, 0.7);
                }
            `}</style>
        </div >
    );
};


export default PublicFeedbackPage;
