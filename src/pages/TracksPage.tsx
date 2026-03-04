import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Loader2, Music, Trash2, Link as LinkIcon, MessageSquare, Pencil, GripVertical } from 'lucide-react';
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
import { FeedbackList } from '../components/FeedbackList';

import type { Feedback } from '../hooks/useFeedbackLogic';
// Local Feedback interface removed in favor of shared type

interface Track {
    id: string;
    title: string;
    url: string;
    platform: 'youtube' | 'soundcloud';
    created_at: string;
    order_index: number;
    feedbacks: Feedback[];
}

// SortableTrackItem Component
interface SortableTrackItemProps {
    track: Track;
    artistName?: string;
    artistProfileImage?: string | null;
    editingTrack: Track | null;
    expandedTrackId: string | null;
    setEditingTrack: (track: Track | null) => void;
    setExpandedTrackId: (id: string | null) => void;
    handleUpdateTrack: () => void;
    setEditingTrackState: (t: any) => void;
    handleDelete: (id: string) => void;
    handleCopyLink: (id: string) => void;
    handleReply: (fid: string, tid: string, content: string) => void;
    handleUnlock: (fid: string, tid: string) => void;
    getThumbnailUrl: (url: string) => string | null;
}

const SortableTrackItem = ({
    track,
    artistName,
    artistProfileImage,
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
            className="group bg-transparent border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all hover:bg-white/5 relative flex flex-col"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Drag Handle */}
                    <div {...attributes} {...listeners} className="cursor-move text-slate-600 hover:text-white touch-none shrink-0 flex items-center justify-center p-1">
                        <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Thumbnail */}
                    <div className="w-14 h-14 bg-slate-900 rounded-xl shrink-0 overflow-hidden relative shadow-lg ring-1 ring-white/10">
                        {getThumbnailUrl(track.url) ? (
                            <img
                                src={getThumbnailUrl(track.url)!}
                                alt="Thumbnail"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                                <Music className="w-6 h-6 text-slate-500" />
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
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Track Title"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleUpdateTrack}
                                    className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 px-3 py-1.5 rounded-lg hover:bg-indigo-500/30 transition-all font-medium"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setEditingTrack(null)}
                                    className="text-xs bg-white/5 text-slate-300 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-base md:text-lg line-clamp-1 truncate pr-2">{track.title || "Untitled Track"}</h4>
                            <div className="flex items-center gap-3 mt-1.5 opacity-80">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400">
                                    {track.platform === 'youtube' ? <div className="w-2 h-2 rounded-full bg-red-500" /> : <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                    {track.platform}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-700" />
                                <span className="text-[11px] text-slate-500 font-medium">
                                    {new Date(track.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions & Feedbacks */}
                <div className="flex items-center gap-3 ml-12 md:ml-0 pt-3 md:pt-0 border-t border-white/5 md:border-t-0 mt-2 md:mt-0">
                    {/* CTA Feedback Button */}
                    <button
                        onClick={() => setExpandedTrackId(expandedTrackId === track.id ? null : track.id)}
                        className={`flex items-center justify-center gap-2 text-[11px] font-bold px-4 py-2.5 rounded-full uppercase tracking-wide transition-all ${((track.feedbacks?.length || 0) > 0)
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] hover:scale-105'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                            }`}
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Feedbacks {(track.feedbacks?.length || 0) > 0 && `(${track.feedbacks?.length})`}
                    </button>

                    <div className="w-px h-8 bg-white/10 mx-1 hidden md:block"></div>

                    <div className="flex items-center gap-1">
                        <button onClick={() => handleCopyLink(track.id)} className="p-2 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-white/5" title="Copy Link">
                            <LinkIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingTrack(track)} className="p-2 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-white/5" title="Edit Track">
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(track.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-full hover:bg-white/5" title="Delete Track">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
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
                        <div className="pt-4 mt-4 border-t border-white/10">
                            <FeedbackList
                                feedbacks={track.feedbacks}
                                isOwner={true}
                                onReply={handleReply}
                                onUnlock={handleUnlock}
                                trackId={track.id}
                                artistName={artistName}
                                artistProfileImage={artistProfileImage}
                            />
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
    const [trackToDelete, setTrackToDelete] = useState<string | null>(null);
    const { showToast } = useToast();

    // Sensors for DnD
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const [userProfile, setUserProfile] = useState<{ handle: string; name: string; avatar: string | null } | null>(null);

    const fetchData = async () => {
        if (!user) return;
        try {
            // Fetch User Handle & Profile
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('handle, display_name, avatar_url')
                .eq('id', user.id)
                .single();

            if (!userError && userData) {
                setUserProfile({
                    handle: userData.handle,
                    name: userData.display_name,
                    avatar: userData.avatar_url
                });
            }

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
                    .from('feedbacks')
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
            // Find the current minimum order_index to place the new track at the top
            const minIndex = tracks.length > 0
                ? Math.min(...tracks.map(t => t.order_index || 0))
                : 0;
            const newOrderIndex = minIndex - 1;

            const { data, error } = await supabase
                .from('tracks')
                .insert({
                    user_id: user.id,
                    url: newTrackUrl,
                    platform: platform,
                    title: newTrackTitle || 'Untitled Track',
                    order_index: newOrderIndex // Add to top (smallest index)
                })
                .select()
                .single();

            if (error) throw error;
            setTracks([data, ...tracks]);
            setNewTrackUrl('');
            setNewTrackTitle('');
            showToast('Track added successfully!', 'success');
        } catch (error: any) {
            console.error('Error adding track:', error);
            setErrorMsg(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (trackId: string) => {
        setTrackToDelete(trackId);
    };

    const confirmDeleteTrack = async () => {
        if (!trackToDelete) return;
        try {
            const { error } = await supabase.from('tracks').delete().eq('id', trackToDelete);
            if (error) throw error;
            setTracks(tracks.filter(t => t.id !== trackToDelete));
            showToast('Track deleted.', 'success');
        } catch (err: any) {
            showToast('Error deleting track.', 'error');
        } finally {
            setTrackToDelete(null);
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
            setEditingTrack(null);
            showToast('Track updated!', 'success');
        } catch (error: any) {
            showToast('Update failed.', 'error');
        }
    };

    const handleReply = async (feedbackId: string, trackId: string, replyContent: string) => {
        try {
            const { error } = await supabase.from('feedbacks').update({ reply: replyContent }).eq('id', feedbackId);
            if (error) throw error;
            setTracks(prev => prev.map(t => t.id === trackId ? {
                ...t, feedbacks: t.feedbacks.map(f => f.id === feedbackId ? { ...f, reply: replyContent } : f)
            } : t));
            showToast('Reply saved!', 'success');
        } catch (error) {
            showToast('Failed to reply.', 'error');
        }
    };

    const handleUnlock = async (feedbackId: string, trackId: string) => {
        try {
            const { error } = await supabase.from('feedbacks').update({ is_unlocked: true }).eq('id', feedbackId);
            if (error) throw error;
            setTracks(prev => prev.map(t => t.id === trackId ? {
                ...t, feedbacks: t.feedbacks.map(f => f.id === feedbackId ? { ...f, is_unlocked: true } : f)
            } : t));
            showToast('Unlocked!', 'success');
        } catch (error) {
            showToast('Failed to unlock.', 'error');
        }
    };

    const handleCopyLink = (trackId: string) => {
        const url = `${window.location.origin}/u/${userProfile?.handle || user?.user_metadata?.handle || 'user'}?track=${trackId}`;
        navigator.clipboard.writeText(url).then(() => showToast('Copied!', 'success'));
    };

    const getThumbnailUrl = (url: string) => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? `https://img.youtube.com/vi/${match[7]}/0.jpg` : null;
    }

    if (loading) return <Layout><div className="flex justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div></Layout>;

    return (
        <Layout>
            <ConfirmModal
                isOpen={!!trackToDelete}
                title="Delete Track"
                message="Are you sure you want to delete this track? This action cannot be undone."
                confirmLabel="Delete"
                isDestructive
                onConfirm={confirmDeleteTrack}
                onCancel={() => setTrackToDelete(null)}
            />
            {/* Toast */}


            <div className="max-w-4xl mx-auto space-y-8 pb-32 mt-10 px-4 md:px-0">
                <header className="mb-12 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">My Studio</h1>
                    <p className="text-slate-500 mt-2 text-sm md:text-base max-w-lg">Manage your tracks and view incoming feedbacks in one place.</p>
                </header>

                {/* Smart Add Track */}
                <div className="mb-14 pb-10 border-b border-white/10">
                    <form onSubmit={handleAddTrack} className="relative group max-w-3xl">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            ) : (
                                <Plus className="w-5 h-5 text-indigo-400 group-focus-within:text-indigo-300 transition-colors" />
                            )}
                        </div>
                        <input
                            type="url"
                            placeholder="🎵 YouTube 또는 SoundCloud 링크를 붙여넣고 엔터를 치세요..."
                            value={newTrackUrl}
                            onChange={e => setNewTrackUrl(e.target.value)}
                            disabled={submitting}
                            className="w-full bg-white/5 border border-white/10 rounded-full pl-14 pr-6 py-4 text-white text-sm md:text-base placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 hover:bg-white/10 transition-all shadow-lg backdrop-blur-sm disabled:opacity-50"
                            required
                        />
                        {errorMsg && <div className="absolute -bottom-8 left-4 text-red-400 text-xs font-medium bg-red-500/10 px-3 py-1.5 rounded-full">{errorMsg}</div>}
                    </form>
                </div>

                {/* Sortable Track List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-white tracking-wide">Your Tracks <span className="text-slate-500 font-medium ml-2 text-sm bg-white/5 px-2 py-0.5 rounded-full">{tracks.length}</span></h3>
                    </div>

                    {tracks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl transition-all">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Music className="w-8 h-8 text-slate-500" />
                            </div>
                            <p className="text-slate-300 font-bold text-lg">No tracks yet</p>
                            <p className="text-slate-500 text-sm mt-1">Paste a link above to add your first track.</p>
                        </div>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={tracks} strategy={verticalListSortingStrategy}>
                                <div className="space-y-3">
                                    {tracks.map(track => (
                                        <SortableTrackItem
                                            key={track.id}
                                            track={track}
                                            artistName={userProfile?.name}
                                            artistProfileImage={userProfile?.avatar}
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
