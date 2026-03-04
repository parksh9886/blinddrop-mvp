import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import {
    Loader2, User as UserIcon, Camera, AlertTriangle, Check, Plus, Trash2,
    ExternalLink, GripVertical, Instagram, Youtube, Twitter, Music2, Disc3,
    Facebook, Linkedin, Globe, Link as LinkIcon, Info
} from 'lucide-react';
import ImageCropModal from '../components/ImageCropModal';
import { useToast } from '../contexts/ToastContext';
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

const ROLES = [
    { value: 'Singer', label: 'Singer' },
    { value: 'Rapper', label: 'Rapper' },
    { value: 'Songwriter', label: 'Songwriter' },
    { value: 'Producer', label: 'Producer' },
    { value: 'Beatmaker', label: 'Beatmaker' }
];

// Helper: Detect Platform from URL
const detectPlatform = (url: string): string => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('instagram.com')) return 'instagram';
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
    if (lowerUrl.includes('tiktok.com')) return 'tiktok';
    if (lowerUrl.includes('spotify.com')) return 'spotify';
    if (lowerUrl.includes('soundcloud.com')) return 'soundcloud';
    if (lowerUrl.includes('music.apple.com')) return 'apple';
    if (lowerUrl.includes('facebook.com')) return 'facebook';
    if (lowerUrl.includes('linkedin.com')) return 'linkedin';
    return 'website';
};

// Helper: Get Icon
const getIconForPlatform = (platform: string, className = "w-4 h-4") => {
    switch (platform.toLowerCase()) {
        case 'instagram': return <Instagram className={className} />;
        case 'youtube': return <Youtube className={className} />;
        case 'twitter': return <Twitter className={className} />;
        case 'tiktok': return <Music2 className={className} />;
        case 'spotify': return <Disc3 className={className} />;
        case 'soundcloud': return <Music2 className={className} />;
        case 'apple': return <Music2 className={className} />;
        case 'facebook': return <Facebook className={className} />;
        case 'linkedin': return <Linkedin className={className} />;
        case 'website': return <Globe className={className} />;
        default: return <LinkIcon className={className} />;
    }
};

interface LinkItem {
    id: string;
    platform: string;
    title: string;
    url: string;
    order_index: number;
}

// --- Sortable Link Item Component ---
interface SortableLinkItemProps {
    link: LinkItem;
    handleDeleteLink: (id: string) => void;
}

const SortableLinkItem = ({ link, handleDeleteLink }: SortableLinkItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: link.id });

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
            className="group flex items-center gap-3 bg-transparent p-4 border-b border-white/10 hover:bg-white/5 transition-colors relative"
        >
            <div {...attributes} {...listeners} className="text-slate-500 cursor-move touch-none">
                <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <div className="text-slate-400">
                        {getIconForPlatform(link.platform, "w-3.5 h-3.5")}
                    </div>
                    <h4 className="text-sm font-medium text-white truncate">{link.title}</h4>
                </div>
                <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-slate-500 truncate hover:text-indigo-400 flex items-center gap-1">
                    {link.url} <ExternalLink className="w-3 h-3" />
                </a>
            </div>
            <button
                onClick={() => handleDeleteLink(link.id)}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                title="Delete Link"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};


const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'links'>('profile');

    // Crop Modal State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [selectedFileToCheckExt, setSelectedFileToCheckExt] = useState<File | null>(null);

    // --- Profile Data (Group A: Auto-save) ---
    const [displayName, setDisplayName] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [collabStatus, setCollabStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
    const [collabTypes, setCollabTypes] = useState<string[]>([]);

    // Auto-save Status
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const firstLoad = useRef(true);

    // --- Handle (Group B: Manual Update) ---
    const [currentHandle, setCurrentHandle] = useState('');
    const [newHandle, setNewHandle] = useState('');
    const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'same'>('idle');
    const [handleMsg, setHandleMsg] = useState('');

    // --- Links State ---
    const [links, setLinks] = useState<LinkItem[]>([]);
    const [newLink, setNewLink] = useState({ platform: 'website', title: '', url: '' });
    const [isLinkAdding, setIsLinkAdding] = useState(false);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Constants
    const COLLAB_OPTIONS = ['Featuring', 'Beat Making', 'Topline', 'Remix', 'Mixing', 'Mastering', 'Lyrics'];

    // Helper check for array
    const isArray = (arr: any): arr is string[] => Array.isArray(arr);

    // --- 1. Fetch Initial Data ---
    useEffect(() => {
        if (!user) return;

        const tabParam = searchParams.get('tab');
        if (tabParam === 'links') setActiveTab('links');

        const fetchData = async () => {
            try {
                // Fetch Profile
                const { data: userData } = await supabase
                    .from('users')
                    .select('handle, bio, avatar_url, display_name, collab_status, collab_types')
                    .eq('id', user.id)
                    .single();

                if (userData) {
                    setCurrentHandle(userData.handle || '');
                    setNewHandle(userData.handle || '');
                    setDisplayName(userData.display_name || '');
                    setCollabStatus(userData.collab_status || 'OPEN');
                    setCollabTypes(isArray(userData.collab_types) ? userData.collab_types : []);
                    setAvatarUrl(userData.avatar_url || user.user_metadata.avatar_url);

                    if (userData.bio) {
                        const roles = userData.bio.split(' · ').filter((r: string) => ROLES.some(opt => opt.value === r || opt.label === r));
                        if (roles.length > 0) setSelectedRoles(roles);
                        else if (userData.bio.includes(' · ')) setSelectedRoles(userData.bio.split(' · '));
                    }
                } else {
                    setAvatarUrl(user.user_metadata.avatar_url);
                }

                // Fetch Links
                const { data: linksData } = await supabase
                    .from('artist_links')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('order_index', { ascending: true });
                setLinks(linksData || []);

            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
                // Allow a small tick before enabling auto-save to avoid initial save triggers
                setTimeout(() => { firstLoad.current = false; }, 500);
            }
        };

        fetchData();
    }, [user, searchParams]);


    // --- 2. Auto-save Logic (Group A) ---
    useEffect(() => {
        if (loading || firstLoad.current || !user) return;

        setSaveStatus('saving');

        const timer = setTimeout(async () => {
            try {
                const bio = selectedRoles.join(' · ');
                const updates = {
                    id: user.id,
                    display_name: displayName,
                    bio: bio,
                    collab_status: collabStatus,
                    collab_types: collabTypes,
                    updated_at: new Date().toISOString(),
                };

                const { error } = await supabase
                    .from('users')
                    .upsert(updates);

                if (error) throw error;
                setSaveStatus('saved');
            } catch (error) {
                console.error('Auto-save error:', error);
                setSaveStatus('error');
            }
        }, 1000); // 1000ms Debounce

        return () => clearTimeout(timer);
    }, [displayName, selectedRoles, collabStatus, collabTypes]); // Dependencies for auto-save


    // --- 3. Avatar Logic (Instant Save) ---
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setSelectedFileToCheckExt(file);
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setCropImageSrc(reader.result?.toString() || null);
            setCropModalOpen(true);
        });
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCropSave = async (croppedBlob: Blob) => {
        setCropModalOpen(false);
        setSaveStatus('saving'); // Show saving indicator globally

        try {
            const fileExt = selectedFileToCheckExt?.name.split('.').pop() || 'jpg';
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload Blob
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, croppedBlob, { contentType: croppedBlob.type });

            if (uploadError) throw uploadError;

            // 2. Get URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

            // 3. Update User Profile Immediately
            const { error: dbError } = await supabase.from('users').upsert({
                id: user?.id,
                avatar_url: publicUrl,
                updated_at: new Date().toISOString()
            });

            if (dbError) throw dbError;

            // 4. Update Auth Metadata
            await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

            setSaveStatus('saved');
        } catch (error) {
            console.error('Avatar save error:', error);
            setSaveStatus('error');
        }
    };


    // --- 4. Handle Management (Group B) ---
    const handleNewHandleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''); // Enforce safe chars
        setNewHandle(val);
        setHandleStatus('idle');
        setHandleMsg('');
    };

    const checkHandle = async () => {
        if (!newHandle) return;
        if (newHandle === currentHandle) {
            setHandleStatus('same');
            return;
        }

        setHandleStatus('checking');
        try {
            const { data } = await supabase
                .from('users')
                .select('id')
                .eq('handle', newHandle)
                .single();

            if (data && data.id !== user?.id) {
                setHandleStatus('taken');
                setHandleMsg('This handle is already taken.');
            } else {
                setHandleStatus('available');
                setHandleMsg('Handle available.');
            }
        } catch (error) {
            // .single() returns error if no rows found, which means available
            setHandleStatus('available');
            setHandleMsg('Handle available.');
        }
    };

    const updateHandle = async () => {
        if (handleStatus !== 'available') return;
        if (!confirm('Changing your handle will break any existing links you have shared. Are you sure you want to proceed?')) return;

        setHandleStatus('checking'); // reuse checking state for loading
        try {
            const { error } = await supabase
                .from('users')
                .upsert({
                    id: user?.id,
                    handle: newHandle,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            setCurrentHandle(newHandle);
            setHandleStatus('idle');
            setHandleMsg('');
            showToast('Handle updated successfully.', 'success');
            // window.location.reload(); // Reload might clear toast, maybe remove? Or keep?
            // If I reload, toast won't show.
            // Let's keep reload for now as handle change might require full re-fetch/context update if not handled reactively.
            // Actually, if we use ToastContext, it's inside App, so reload will kill it.
            // But updating handle changes URL potentially?
            // "Changing your handle will break any existing links..."
            // If I reload, the toast is lost.
            // Better to NOT reload if possible, or accept toast is lost.
            // Given the requirement "Refactoring Toast Notifications", let's assuming we want to SEE the notification.
            // I'll show toast and DELAY reload, or just not reload if the app handles it.
            // The code sets currentHandle(newHandle).
            // Let's remove reload for better UX if the state updates effectively.
            // But if there are other side effects... let's stick to simple replacement first but comment out reload or use setTimeout.
            setTimeout(() => window.location.reload(), 2000);
        } catch (err: any) {
            console.error('Handle update error:', err);
            setHandleStatus('taken'); // Fallback
            setHandleMsg('Error updating handle.');
        }
    };


    // --- 5. Link Management ---
    const handleAddLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newLink.url || !newLink.title) return;

        setIsLinkAdding(true);
        try {
            let formattedUrl = newLink.url.trim();
            if (!/^https?:\/\//i.test(formattedUrl)) {
                formattedUrl = `https://${formattedUrl}`;
            }

            const { data, error } = await supabase
                .from('artist_links')
                .insert({
                    user_id: user.id,
                    platform: newLink.platform,
                    title: newLink.title,
                    url: formattedUrl,
                    order_index: links.length // Append to end
                })
                .select()
                .single();

            if (error) throw error;
            setLinks([...links, data]);
            setNewLink({ platform: 'website', title: '', url: '' });
        } catch (error) {
            console.error('Error adding link:', error);
        } finally {
            setIsLinkAdding(false);
        }
    };

    const handleDeleteLink = async (id: string) => {
        if (!confirm('Are you sure you want to delete this link?')) return;
        try {
            const { error } = await supabase.from('artist_links').delete().eq('id', id);
            if (error) throw error;
            setLinks(links.filter(l => l.id !== id));
        } catch (error) {
            console.error('Error deleting link:', error);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setLinks((items) => {
                const oldIndex = items.findIndex((l) => l.id === active.id);
                const newIndex = items.findIndex((l) => l.id === over?.id);
                const newLinks = arrayMove(items, oldIndex, newIndex);

                // Prepare updates
                const updates = newLinks.map((link, index) => ({
                    id: link.id,
                    order_index: index
                }));

                // Execute updates in background with Promise.all
                const saveOrder = async () => {
                    try {
                        setSaveStatus('saving');
                        const promises = updates.map(update =>
                            supabase.from('artist_links')
                                .update({ order_index: update.order_index })
                                .eq('id', update.id)
                        );

                        const results = await Promise.all(promises);

                        // Check for hard errors
                        const dbError = results.find(r => r.error)?.error;
                        if (dbError) throw dbError;

                        setSaveStatus('saved');
                        setTimeout(() => setSaveStatus('idle'), 2000);
                    } catch (err: any) {
                        console.error('Failed to save link order:', err);
                        setSaveStatus('error');
                    }
                };
                saveOrder();

                return newLinks;
            });
        }
    };


    // --- UI Helpers ---
    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const toggleCollabType = (type: string) => {
        setCollabTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
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
            <div className="max-w-xl mx-auto px-4 pb-20">
                <h1 className="text-3xl font-bold mb-6">Settings</h1>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'}`}
                    >
                        Profile & Collab
                    </button>
                    <button
                        onClick={() => setActiveTab('links')}
                        className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'links' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'}`}
                    >
                        Manage Links
                    </button>
                </div>

                {activeTab === 'profile' ? (
                    <div className="space-y-8">
                        {/* --- Profile Data Section --- */}
                        <div className="space-y-12 relative pb-10 border-b border-white/10">
                            {/* Header & Status Indicator */}
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-bold text-white">Profile</h2>
                                <div className="flex items-center gap-2">
                                    {saveStatus === 'saving' && (
                                        <div className="flex items-center gap-2 text-indigo-400 text-sm animate-pulse">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                        </div>
                                    )}
                                    {saveStatus === 'saved' && (
                                        <div className="flex items-center gap-2 text-green-500 text-sm">
                                            <Check className="w-4 h-4" /> Saved
                                        </div>
                                    )}
                                    {saveStatus === 'error' && (
                                        <div className="flex items-center gap-2 text-red-400 text-sm">
                                            <AlertTriangle className="w-4 h-4" /> Error
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Avatar */}
                            <div className="flex flex-col items-center pt-4">
                                <div className="relative group">
                                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden ring-1 ring-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)] group-hover:ring-white/40 transition-all">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-10 h-10 text-slate-600" />
                                        )}
                                    </div>
                                    <label className="absolute bottom-1 right-1 p-2 bg-slate-800/80 backdrop-blur-sm rounded-full text-white cursor-pointer hover:bg-slate-700 ring-1 ring-white/20 transition-all shadow-xl">
                                        <Camera className="w-3.5 h-3.5" />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                    </label>
                                </div>
                                <p className="text-[11px] uppercase tracking-widest text-gray-500 mt-5">Tap icon to change photo</p>
                            </div>

                            {/* Display Name */}
                            <div>
                                <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-2">Activity Name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="e.g. The Weeknd"
                                    className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white text-lg focus:outline-none focus:border-indigo-400 placeholder:text-slate-600 transition-colors"
                                />
                            </div>

                            {/* Roles */}
                            <div>
                                <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-4">Roles</label>
                                <div className="flex flex-wrap gap-2.5">
                                    {ROLES.map((role) => {
                                        const isSelected = selectedRoles.includes(role.value);
                                        return (
                                            <button
                                                key={role.value}
                                                type="button"
                                                onClick={() => toggleRole(role.value)}
                                                className={`px-5 py-2 rounded-full text-xs tracking-wide font-medium transition-all flex items-center gap-2 border ${isSelected
                                                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                                    : 'border-white/10 bg-transparent text-slate-400 hover:border-white/30'
                                                    }`}
                                            >
                                                {role.label}
                                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Collaboration Settings */}
                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">Collaboration</div>
                                        <div className="text-sm text-slate-300">Accepting Collaborations?</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCollabStatus(prev => prev === 'OPEN' ? 'CLOSED' : 'OPEN')}
                                        className={`relative w-12 h-6 rounded-full transition-all flex items-center px-1 ${collabStatus === 'OPEN'
                                            ? 'bg-indigo-500/20 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                                            : 'bg-white/5 border border-white/10'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full transition-transform ${collabStatus === 'OPEN' ? 'translate-x-6 bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'translate-x-0 bg-slate-500'}`} />
                                    </button>
                                </div>

                                <div className={`transition-opacity duration-300 ${collabStatus === 'CLOSED' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                    <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-4">Interests</label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {COLLAB_OPTIONS.map((type) => {
                                            const isSelected = collabTypes.includes(type);
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => toggleCollabType(type)}
                                                    className={`px-5 py-2 rounded-full text-xs tracking-wide font-medium transition-all border ${isSelected
                                                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                                        : 'border-white/10 bg-transparent text-slate-400 hover:border-white/30'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- Unique Handle Section (Group B) --- */}
                        <div className="space-y-8 relative pb-10 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-white">Unique Handle</h2>
                                <Info className="w-4 h-4 text-slate-500" />
                            </div>

                            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-sm">
                                <span className="font-bold flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4" /> Warning:</span>
                                Changing your handle will break your existing profile link (blinddrop.com/u/{currentHandle}).
                            </div>

                            <div>
                                <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-2">My Page URL</label>
                                <div className="flex items-end gap-3">
                                    <div className="relative flex-1 flex items-center border-b border-white/20 transition-colors focus-within:border-indigo-400">
                                        <span className="text-slate-500 text-lg mr-1 pb-2 shrink-0">blinddrop.com/u/</span>
                                        <input
                                            type="text"
                                            value={newHandle}
                                            onChange={handleNewHandleInput}
                                            placeholder="your_handle"
                                            autoComplete="off"
                                            autoCapitalize="off"
                                            autoCorrect="off"
                                            spellCheck="false"
                                            style={{ imeMode: 'disabled' } as any}
                                            className="w-full bg-transparent px-0 py-2 pb-2 text-white text-lg focus:outline-none placeholder:text-slate-600 transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={checkHandle}
                                        disabled={newHandle === currentHandle || !newHandle}
                                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold rounded-full transition-colors disabled:opacity-50 whitespace-nowrap"
                                    >
                                        Check
                                    </button>
                                </div>
                                {/* Handle Check Message */}
                                {handleStatus !== 'idle' && (
                                    <div className={`mt-3 text-sm flex items-center gap-2 ${handleStatus === 'available' ? 'text-green-400' :
                                        handleStatus === 'taken' ? 'text-red-400' :
                                            handleStatus === 'same' ? 'text-slate-400' : 'text-indigo-400'
                                        }`}>
                                        {handleStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {handleStatus === 'available' && <Check className="w-4 h-4" />}
                                        {handleStatus === 'taken' && <AlertTriangle className="w-4 h-4" />}
                                        {handleMsg || (handleStatus === 'same' && "This is your current handle.")}
                                    </div>
                                )}
                            </div>

                            {/* Manual Update Button - Only shows if available */}
                            {handleStatus === 'available' && (
                                <button
                                    onClick={updateHandle}
                                    className="w-full py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 font-bold rounded-full transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                >
                                    Confirm Update
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    // --- Manage Links Tab ---
                    <div className="space-y-10 relative pb-10">
                        {/* Add New Link Form */}
                        <form onSubmit={handleAddLink} className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <Plus className="w-5 h-5" /> Add New Link
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-2">Link Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Listen on Spotify"
                                        value={newLink.title}
                                        onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                                        className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white text-lg focus:outline-none focus:border-indigo-400 placeholder:text-slate-600 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-2">Link URL</label>
                                    <div className="relative flex items-center border-b border-white/20 focus-within:border-indigo-400 transition-colors">
                                        <div className="text-slate-400 pointer-events-none mr-3">
                                            {getIconForPlatform(newLink.platform, "w-5 h-5")}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Paste any link (YouTube, Instagram, Spotify...)"
                                            value={newLink.url}
                                            onChange={(e) => {
                                                const url = e.target.value;
                                                const detected = detectPlatform(url);
                                                setNewLink({ ...newLink, url, platform: detected });
                                            }}
                                            className="w-full bg-transparent px-0 py-3 pb-3 text-white text-lg focus:outline-none placeholder:text-slate-600 transition-colors"
                                            required
                                        />
                                        {newLink.url && (
                                            <div className="absolute right-0 text-xs text-indigo-400 font-medium animate-in fade-in slide-in-from-left-1">
                                                {newLink.platform}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLinkAdding}
                                className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLinkAdding ? 'Adding...' : 'Add to Profile'}
                            </button>
                        </form>

                        {/* Links List */}
                        <div className="space-y-3 pt-6 border-t border-white/10">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={links} strategy={verticalListSortingStrategy}>
                                    {links.map((link) => (
                                        <SortableLinkItem key={link.id} link={link} handleDeleteLink={handleDeleteLink} />
                                    ))}
                                </SortableContext>
                            </DndContext>

                            {links.length === 0 && (
                                <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                                    <p className="text-slate-400 text-sm">No links yet.</p>
                                    <p className="text-slate-600 text-xs mt-1">Add your social media to fill up your generic link hub.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Crop Modal */}
            {cropModalOpen && cropImageSrc && (
                <ImageCropModal
                    imageSrc={cropImageSrc}
                    onCancel={() => setCropModalOpen(false)}
                    onCropComplete={handleCropSave}
                />
            )}
        </Layout>
    );
};

export default ProfilePage;
