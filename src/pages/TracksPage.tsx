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
                            placeholder="🎵 Drop your track link..."
                            value={newTrackUrl}
                            onChange={e => setNewTrackUrl(e.target.value)}
                            disabled={submitting}
                            className="w-full bg-white/5 border border-white/10 rounded-full pl-14 pr-6 py-4 text-white text-sm md:text-base placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 hover:bg-white/10 transition-all shadow-lg backdrop-blur-sm disabled:opacity-50"
                            required
                        />
                        {errorMsg && <div className="absolute -bottom-14 left-4 text-red-400 text-xs font-medium bg-red-500/10 px-3 py-1.5 rounded-full">{errorMsg}</div>}

                        <div className="flex items-center gap-3 mt-3 ml-4">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Supported:</span>
                            <div className="flex items-center gap-3">
                                {/* YouTube SVG */}
                                <div className="flex items-center justify-center hover:scale-110 transition-transform cursor-pointer" title="YouTube">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                </div>
                                {/* SoundCloud SVG */}
                                <div className="flex items-center justify-center hover:scale-110 transition-transform cursor-pointer" title="SoundCloud">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FF5500">
                                        <path d="M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.747.747 0 0 1 .452-.724s.75-.513 2.333-.513a5.364 5.364 0 0 1 2.763.755 5.433 5.433 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12.884 0 1.73.358 2.347.992s.948 1.49.922 2.373ZM10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0ZM9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0Zm-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0Zm-1.647.77a26.108 26.108 0 0 1-.008 7.147.272.272 0 0 1-.542 0 27.955 27.955 0 0 1 0-7.147.275.275 0 0 1 .55 0Zm-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412-.026.28-.514.283-.54 0-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0Zm-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0Z" />
                                    </svg>
                                </div>
                                {/* Spotify Outline for Future SVG */}
                                <div className="flex items-center justify-center opacity-40 grayscale cursor-not-allowed hover:opacity-60 transition-opacity" title="Spotify (Coming Soon)">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1ED760">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.181-1.38-.781s.18-1.2.78-1.381c4.26-1.261 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.239.54-.959.72-1.5.42h-.12z" />
                                    </svg>
                                </div>
                                {/* Apple Music Outline for Future SVG */}
                                <div className="flex items-center justify-center opacity-40 grayscale cursor-not-allowed hover:opacity-60 transition-opacity" title="Apple Music (Coming Soon)">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FA243C">
                                        <path d="M16.924 10.662V4.496c-.02-.916-.838-1.545-1.585-1.748L7.33 1.056c-.663-.2-1.365-.246-1.921.144-.45.313-.674.88-.66 1.45v13.513c0 .034 0 .07-.002.106-.118-.08-.258-.15-.403-.21-.498-.204-1.077-.282-1.637-.257-.93.04-1.84.444-2.336 1.25-.333.541-.399 1.246-.205 1.83.176.536.56.98 1.026 1.284a3.179 3.179 0 001.385.503c.801.072 1.627-.146 2.21-.692.766-.714 1.13-1.8 1.141-2.906V8.156l8-2.288v9.98c0 .032 0 .066-.002.1-.118-.08-.258-.15-.403-.208-.498-.205-1.077-.283-1.638-.258-.93.04-1.84.444-2.336 1.252-.333.54-.4 1.245-.205 1.828.176.538.56.98 1.026 1.285.39.255.88.423 1.384.503.801.073 1.628-.146 2.21-.692.767-.714 1.13-1.8 1.14-2.906v-6.39z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
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
