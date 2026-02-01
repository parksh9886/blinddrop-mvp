import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { Plus, Loader2, Music, ExternalLink, Trash2, Link as LinkIcon, AlertCircle, MessageSquare, ChevronDown, ChevronUp, CheckCircle2, User, Lock, Pencil, GripVertical } from 'lucide-react';
// import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// DnD Kit
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    order_index: number;
    feedbacks: Feedback[];
}

// --- Sortable Track Item Component ---
interface SortableTrackItemProps {
    track: Track;
    userHandle: string; // Add this prop
    editingTrack: Track | null;
    expandedTrackId: string | null;
    setEditingTrack: (track: Track | null) => void;
    setExpandedTrackId: (id: string | null) => void;
    handleUpdateTrack: () => void;
    setEditingTrackState: (t: any) => void; // Helper to update local editing state
    handleDelete: (id: string) => void;
    handleCopyLink: (id: string) => void;
    handleReply: (fid: string, tid: string, content: string) => void;
    handleUnlock: (fid: string, tid: string) => void;
    getThumbnailUrl: (url: string) => string | null;
}

const SortableTrackItem = ({
    track,
    userHandle,
    editingTrack,
    expandedTrackId,
    setEditingTrack,
    setExpandedTrackId,
    handleUpdateTrack,
    setEditingTrackState,
    handleDelete,
    handleCopyLink,
    handleReply,
    handleUnlock,
    getThumbnailUrl
}: SortableTrackItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: track.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group bg-slate-900/50 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-3 transition-all hover:bg-slate-900 relative"
        >
            <div className="flex items-start justify-between">
                <div className="flex gap-3 flex-1 min-w-0">
                    {/* Drag Handle */}
                    <div {...attributes} {...listeners} className="mt-4 cursor-move text-slate-600 hover:text-white touch-none">
                        <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Thumbnail Logic (Compact: w-12 h-12) */}
                    <div className="w-12 h-12 bg-slate-800 rounded-lg flex-shrink-0 overflow-hidden relative mt-1">
                        {getThumbnailUrl(track.url) ? (
                            <img
                                src={getThumbnailUrl(track.url)!}
                                alt="Thumbnail"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Music className="w-5 h-5 text-slate-500" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    {editingTrack?.id === track.id ? (
                        <div className="flex-1 space-y-2 mr-2">
                            <input
                                type="text"
                                value={editingTrack.title}
                                onChange={(e) => setEditingTrackState({ ...editingTrack, title: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                            />
                            <input
                                type="text"
                                value={editingTrack.url}
                                onChange={(e) => setEditingTrackState({ ...editingTrack, url: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-400"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleUpdateTrack}
                                    className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-500"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setEditingTrack(null)}
                                    className="text-xs bg-slate-700 text-white px-3 py-1 rounded hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h4 className="font-medium text-white line-clamp-1 text-sm truncate pr-2">{track.title || "Untitled Track"}</h4>
                            <div className="text-[10px] text-slate-500 hover:text-indigo-400 line-clamp-1 leading-relaxed truncate">
                                {track.url}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${track.platform === 'youtube' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                    {track.platform}
                                </span>
                                <span className="text-[10px] text-slate-600">
                                    {new Date(track.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 ml-2 mt-1">
                    <a
                        href={`/@${userHandle}?track=${track.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                        title="View Public Link"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                        onClick={() => setEditingTrack(track)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                        title="Edit Track"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => handleDelete(track.id)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete Track"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Feedback Section Toggle (Compact) */}
            <div className="mt-2 flex items-center justify-between border-t border-slate-800/50 pt-2">
                <button
                    onClick={() => handleCopyLink(track.id)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors ml-9"
                >
                    <LinkIcon className="w-3 h-3" />
                    <span className="truncate max-w-[150px] md:max-w-none">Copy Link</span>
                </button>

                <button
                    onClick={() => setExpandedTrackId(expandedTrackId === track.id ? null : track.id)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded-full uppercase tracking-wide"
                >
                    <MessageSquare className="w-3 h-3" />
                    Feedbacks ({track.feedbacks?.length || 0})
                    {expandedTrackId === track.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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
                        <div className="pt-3 space-y-2 ml-9">
                            {track.feedbacks && track.feedbacks.length > 0 ? (
                                (() => {
                                    const sortedByDate = [...track.feedbacks].sort((a, b) =>
                                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                    );

                                    const processedFeedbacks = sortedByDate.map((fb, index) => ({
                                        ...fb,
                                        isReadable: index < 3 || fb.is_unlocked
                                    }));

                                    return processedFeedbacks.map((fb) => (
                                        <div key={fb.id} className={`rounded-xl p-3 border transition-all ${fb.isReadable ? 'bg-slate-950 border-slate-800' : 'bg-slate-900/50 border-slate-800/50 relative overflow-hidden'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${fb.isReadable ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : 'bg-slate-800'}`}>
                                                    <User className="w-2.5 h-2.5" />
                                                </div>
                                                <span className={`text-xs font-bold ${fb.isReadable ? 'text-slate-400' : 'text-slate-500'}`}>Anonymous</span>
                                                <span className={`text-[10px] ml-auto ${fb.isReadable ? 'text-slate-600' : 'text-slate-700'}`}>{new Date(fb.created_at).toLocaleDateString()}</span>
                                            </div>

                                            <p className={`text-sm leading-relaxed mb-2 transition-all ${fb.isReadable ? 'text-slate-300' : 'text-slate-500 blur-sm select-none pointer-events-none'}`}>
                                                {fb.content}
                                            </p>

                                            {fb.isReadable ? (
                                                fb.reply ? (
                                                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2 ml-3 border-l-2 border-l-indigo-500">
                                                        <div className="text-[10px] font-bold text-indigo-400 mb-0.5 flex items-center gap-1">
                                                            <CheckCircle2 className="w-2.5 h-2.5" /> Reply
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
                                                        className="flex gap-2"
                                                    >
                                                        <input
                                                            name="reply"
                                                            type="text"
                                                            placeholder="Reply..."
                                                            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                                            required
                                                        />
                                                        <button type="submit" className="bg-slate-800 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs transition-colors">
                                                            Reply
                                                        </button>
                                                    </form>
                                                )
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                                    <button
                                                        onClick={() => handleUnlock(fb.id, track.id)}
                                                        className="flex items-center gap-1 bg-slate-800/90 hover:bg-indigo-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-700 hover:border-indigo-500"
                                                    >
                                                        <Lock className="w-3 h-3" /> Unlock
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ));
                                })()
                            ) : (
                                <div className="text-center py-4 text-slate-500 text-xs bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                                    No feedback yet.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Main TracksPage Component ---
const TracksPage: React.FC = () => {
    const { user } = useAuth();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTrackUrl, setNewTrackUrl] = useState('');
    const [newTrackTitle, setNewTrackTitle] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
    const [editingTrack, setEditingTrack] = useState<Track | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Sensors for DnD
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const fetchData = async () => {
        if (!user) return;
        try {
            // Fetch Tracks
            // NOTE: Reverted to sorting by created_at because 'order_index' column likely doesn't exist yet.
            const { data: tracksData, error: tracksError } = await supabase
                .from('tracks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (tracksError) throw tracksError;

            if (tracksData && tracksData.length > 0) {
                // Client-side sort if order_index exists
                if (tracksData[0].order_index !== undefined) {
                    tracksData.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                }
                const trackIds = tracksData.map((t: Track) => t.id);
                // Fetch Feedbacks
                const { data: feedbacksData, error: feedbacksError } = await supabase
                    .from('feedbacks_secure_view')
                    .select('*')
                    .in('track_id', trackIds)
                    .order('created_at', { ascending: false });

                if (feedbacksError) throw feedbacksError;

                const tracksWithFeedbacks = tracksData.map((track: Track) => ({
                    ...track,
                    feedbacks: feedbacksData?.filter((fb: Feedback) => fb.track_id === track.id) || []
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

    // Handle Drag End
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setTracks((items) => {
                const oldIndex = items.findIndex((t) => t.id === active.id);
                const newIndex = items.findIndex((t) => t.id === over?.id);
                const newTracks = arrayMove(items, oldIndex, newIndex);

                // Persist new order
                const updates = newTracks.map((track, index) => ({
                    id: track.id,
                    order_index: index,
                    title: track.title, // Required fields for update if strict
                    updated_at: new Date().toISOString()
                }));

                // Update in background
                updates.forEach(async (update) => {
                    await supabase.from('tracks').update({ order_index: update.order_index }).eq('id', update.id);
                });

                return newTracks;
            });
        }
    };

    const handleAddTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTrackUrl) return;
        setSubmitting(true);
        setErrorMsg('');

        let platform: 'youtube' | 'soundcloud' | null = null;
        if (newTrackUrl.includes('youtube.com') || newTrackUrl.includes('youtu.be')) platform = 'youtube';
        else if (newTrackUrl.includes('soundcloud.com')) platform = 'soundcloud';

        if (!platform) {
            setErrorMsg('Only YouTube and SoundCloud links are supported.');
            setSubmitting(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('tracks')
                .insert({
                    user_id: user.id,
                    url: newTrackUrl,
                    platform: platform,
                    title: newTrackTitle || 'Untitled Track',
                    order_index: tracks.length // Add to end
                })
                .select()
                .single();

            if (error) throw error;
            setTracks([data, ...tracks]);
            setNewTrackUrl('');
            setNewTrackTitle('');
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
            const { error } = await supabase.from('tracks').delete().eq('id', trackId);
            if (error) throw error;
            setTracks(tracks.filter(t => t.id !== trackId));
            setToast({ message: 'Track deleted.', type: 'success' });
        } catch (err: any) {
            setToast({ message: 'Error deleting track.', type: 'error' });
        }
    };

    const handleUpdateTrack = async () => {
        if (!editingTrack) return;
        try {
            const { error } = await supabase
                .from('tracks')
                .update({ title: editingTrack.title, url: editingTrack.url })
                .eq('id', editingTrack.id);

            if (error) throw error;
            setTracks(tracks.map(t => t.id === editingTrack.id ? { ...t, title: editingTrack.title, url: editingTrack.url } : t));
            setEditingTrack(null);
            setToast({ message: 'Track updated!', type: 'success' });
        } catch (error: any) {
            setToast({ message: 'Update failed.', type: 'error' });
        }
    };

    const handleReply = async (feedbackId: string, trackId: string, replyContent: string) => {
        try {
            const { error } = await supabase.from('feedbacks').update({ reply: replyContent }).eq('id', feedbackId);
            if (error) throw error;
            setTracks(prev => prev.map(t => t.id === trackId ? {
                ...t, feedbacks: t.feedbacks.map(f => f.id === feedbackId ? { ...f, reply: replyContent } : f)
            } : t));
            setToast({ message: 'Reply saved!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to reply.', type: 'error' });
        }
    };

    const handleUnlock = async (feedbackId: string, trackId: string) => {
        try {
            const { error } = await supabase.from('feedbacks').update({ is_unlocked: true }).eq('id', feedbackId);
            if (error) throw error;
            setTracks(prev => prev.map(t => t.id === trackId ? {
                ...t, feedbacks: t.feedbacks.map(f => f.id === feedbackId ? { ...f, is_unlocked: true } : f)
            } : t));
            setToast({ message: 'Unlocked!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to unlock.', type: 'error' });
        }
    };

    const handleCopyLink = (trackId: string) => {
        const url = `${window.location.origin}/@${user?.user_metadata?.handle || user?.email?.split('@')[0]}?track=${trackId}`;
        navigator.clipboard.writeText(url).then(() => setToast({ message: 'Copied!', type: 'success' }));
    };

    const getThumbnailUrl = (url: string) => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? `https://img.youtube.com/vi/${match[7]}/0.jpg` : null;
    }

    if (loading) return <Layout><div className="flex justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div></Layout>;

    return (
        <Layout>
            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 ${toast.type === 'success' ? 'bg-indigo-600' : 'bg-red-600'} text-white`}>
                    {toast.type === 'success' ? <LinkIcon className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <header>
                    <h1 className="text-3xl font-bold">My Tracks</h1>
                </header>

                {/* Add Track */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-400" /> Add New Track</h3>
                    <form onSubmit={handleAddTrack} className="flex flex-col gap-3">
                        <div className="relative">
                            <Music className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input type="text" placeholder="Track Title" value={newTrackTitle} onChange={e => setNewTrackTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 text-white" />
                        </div>
                        <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input type="url" placeholder="YouTube / SoundCloud Link" value={newTrackUrl} onChange={e => setNewTrackUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 text-white" required />
                        </div>
                        {errorMsg && <div className="text-red-400 text-sm">{errorMsg}</div>}
                        <button type="submit" disabled={submitting} className="self-end px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm disabled:opacity-50">{submitting ? 'Adding...' : 'Add Track'}</button>
                    </form>
                </div>

                {/* Sortable Track List */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Your Tracks ({tracks.length})</h3>
                    {tracks.length === 0 ? (
                        <p className="text-slate-500 text-center py-10 border border-dashed border-slate-800 rounded-xl">No tracks yet.</p>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={tracks} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {tracks.map(track => (
                                        <SortableTrackItem
                                            key={track.id}
                                            track={track}
                                            userHandle={user?.user_metadata?.handle || user?.email?.split('@')[0]}
                                            editingTrack={editingTrack}
                                            expandedTrackId={expandedTrackId}
                                            setEditingTrack={setEditingTrack}
                                            setExpandedTrackId={setExpandedTrackId}
                                            handleUpdateTrack={handleUpdateTrack}
                                            setEditingTrackState={setEditingTrack}
                                            handleDelete={handleDelete}
                                            handleCopyLink={handleCopyLink}
                                            handleReply={handleReply}
                                            handleUnlock={handleUnlock}
                                            getThumbnailUrl={getThumbnailUrl}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default TracksPage;
