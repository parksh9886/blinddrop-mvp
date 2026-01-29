import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import {
    Save, Loader2, User as UserIcon, Camera, AlertTriangle, Check, Plus, Trash2,
    ExternalLink, GripVertical, Instagram, Youtube, Twitter, Music2, Disc3,
    Facebook, Linkedin, Globe, Link as LinkIcon
} from 'lucide-react';

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

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'links'>('profile');

    // Profile Form State
    const [handle, setHandle] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [originalHandle, setOriginalHandle] = useState('');
    const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);
    const [collabStatus, setCollabStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
    const [collabTypes, setCollabTypes] = useState<string[]>([]);

    // Links State
    const [links, setLinks] = useState<LinkItem[]>([]);
    const [newLink, setNewLink] = useState({ platform: 'website', title: '', url: '' });

    // Constants
    const COLLAB_OPTIONS = ['Featuring', 'Beat Making', 'Topline', 'Remix', 'Mixing', 'Mastering', 'Lyrics'];

    // Fetch Profile & Links
    useEffect(() => {
        if (!user) return;

        // Check for tab param
        const tabParam = searchParams.get('tab');
        if (tabParam === 'links') {
            setActiveTab('links');
        }

        const fetchData = async () => {
            try {
                // 1. Fetch Profile
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('handle, bio, avatar_url, display_name, collab_status, collab_types')
                    .eq('id', user.id)
                    .single();

                if (userError && userError.code !== 'PGRST116') {
                    console.error('Error fetching profile:', userError);
                }

                if (userData) {
                    setHandle(userData.handle || '');
                    setOriginalHandle(userData.handle || '');
                    setDisplayName(userData.display_name || '');

                    // Collab Settings
                    setCollabStatus(userData.collab_status || 'OPEN');
                    setCollabTypes(isArray(userData.collab_types) ? userData.collab_types : []);

                    // Parse Roles from Bio
                    if (userData.bio) {
                        const roles = userData.bio.split(' · ').filter((r: string) => ROLES.some(opt => opt.value === r || opt.label === r));
                        if (roles.length > 0) {
                            setSelectedRoles(roles);
                        } else if (userData.bio.includes(' · ')) {
                            setSelectedRoles(userData.bio.split(' · '));
                        }
                    }

                    setAvatarUrl(userData.avatar_url || user.user_metadata.avatar_url);
                } else {
                    setAvatarUrl(user.user_metadata.avatar_url);
                }

                // 2. Fetch Links
                const { data: linksData, error: linksError } = await supabase
                    .from('artist_links')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('order_index', { ascending: true });

                if (linksError) throw linksError;
                setLinks(linksData || []);

            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, searchParams]);

    // Helper check for array
    const isArray = (arr: any): arr is string[] => Array.isArray(arr);

    // Avatar Upload Handler
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        setSaving(true);
        setMsg(null);

        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
            setMsg({ type: 'success', text: 'Image uploaded! Click Save to persist changes.' });
        } catch (error: any) {
            console.error('Upload error:', error);
            setMsg({ type: 'error', text: 'Failed to upload image.' });
        } finally {
            setSaving(false);
        }
    };

    // Handle Validation
    const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toLowerCase();
        if (/^[a-z0-9_.]*$/.test(val)) {
            setHandle(val);
        }
    };

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
        );
    };

    const toggleCollabType = (type: string) => {
        setCollabTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    // --- Link Management Handlers ---

    const handleAddLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newLink.url || !newLink.title) return;

        setSaving(true);
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
            setMsg({ type: 'success', text: 'Link added successfully!' });
        } catch (error: any) {
            console.error('Error adding link:', error);
            setMsg({ type: 'error', text: 'Failed to add link.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLink = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const { error } = await supabase
                .from('artist_links')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setLinks(links.filter(l => l.id !== id));
        } catch (error) {
            console.error('Error deleting link:', error);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setMsg(null);

        try {
            // Check for handle Uniqueness if changed
            if (handle !== originalHandle) {
                const { data: existing } = await supabase
                    .from('users')
                    .select('id')
                    .eq('handle', handle)
                    .single();

                if (existing && existing.id !== user.id) {
                    throw new Error('This handle is already taken.');
                }
            }

            // Construct Bio from Roles
            const bio = selectedRoles.join(' · ');

            // Upsert Profile
            const updates = {
                id: user.id,
                handle,
                display_name: displayName,
                bio: bio,
                avatar_url: avatarUrl,
                collab_status: collabStatus,
                collab_types: collabTypes,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('users')
                .upsert(updates);

            if (error) throw error;

            if (avatarUrl !== user.user_metadata.avatar_url) {
                await supabase.auth.updateUser({
                    data: { avatar_url: avatarUrl }
                });
            }

            setOriginalHandle(handle);
            setMsg({ type: 'success', text: 'Profile saved successfully!' });
        } catch (error: any) {
            console.error('Save error:', error);
            setMsg({ type: 'error', text: error.message || 'Error saving profile.' });
        } finally {
            setSaving(false);
        }
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
            <div className="max-w-xl mx-auto px-4">
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

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8">

                    {activeTab === 'profile' ? (
                        <>
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-700 group-hover:border-indigo-500 transition-colors">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-10 h-10 text-slate-500" />
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white cursor-pointer hover:bg-indigo-500 transition-colors shadow-lg">
                                        <Camera className="w-4 h-4" />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={saving} />
                                    </label>
                                </div>
                                <p className="mt-3 text-sm text-slate-400">Tap icon to change photo</p>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-6">

                                {/* Display Name Input (Activity Name) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Activity Name (Display Name)</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="e.g. The Weeknd"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Handle Input */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Unique Handle</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">blinddrop.com/u/</span>
                                        <input
                                            type="text"
                                            value={handle}
                                            onChange={handleHandleChange}
                                            placeholder="your_handle"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-36 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Roles Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Roles</label>
                                    <div className="flex flex-wrap gap-2">
                                        {ROLES.map((role) => {
                                            const isSelected = selectedRoles.includes(role.value);
                                            return (
                                                <button
                                                    key={role.value}
                                                    type="button"
                                                    onClick={() => toggleRole(role.value)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 border ${isSelected
                                                        ? 'bg-indigo-600 border-indigo-500 text-white'
                                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
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
                                <div className="pt-6 border-t border-slate-800">
                                    <h3 className="text-lg font-bold text-white mb-4">Collaboration Preferences</h3>

                                    {/* Status Toggle */}
                                    <div className="flex items-center justify-between mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                        <div>
                                            <div className="text-sm font-medium text-white mb-1">Accepting Collaborations?</div>
                                            <div className="text-xs text-slate-500">Turn this off if you are fully booked.</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setCollabStatus(prev => prev === 'OPEN' ? 'CLOSED' : 'OPEN')}
                                            className={`relative w-14 h-8 rounded-full transition-colors flex items-center px-1 ${collabStatus === 'OPEN' ? 'bg-green-500' : 'bg-slate-700'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${collabStatus === 'OPEN' ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    {/* Collab Types */}
                                    <div className={`transition-opacity duration-300 ${collabStatus === 'CLOSED' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                        <label className="block text-sm font-medium text-slate-300 mb-3">Interests (What are you looking for?)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {COLLAB_OPTIONS.map((type) => {
                                                const isSelected = collabTypes.includes(type);
                                                return (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => toggleCollabType(type)}
                                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${isSelected
                                                            ? 'bg-white text-black border-white'
                                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                                                            }`}
                                                    >
                                                        {type}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Status Message */}
                                {msg && (
                                    <div className={`flex items-center gap-2 p-4 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                        msg.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                            'bg-indigo-500/10 text-indigo-400'
                                        }`}>
                                        {msg.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {msg.text}
                                    </div>
                                )}

                                {/* Save Button */}
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {saving ? 'Saving...' : 'Save Profile'}
                                </button>
                            </form>
                        </>
                    ) : (
                        // --- Manage Links Tab ---
                        <div className="space-y-8">
                            {/* Add New Link Form */}
                            <form onSubmit={handleAddLink} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                                <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Add New Link
                                </h3>

                                <div className="space-y-4">
                                    {/* URL Input with Auto-Detect Icon */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Link URL</label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-3 text-slate-400 pointer-events-none">
                                                {getIconForPlatform(newLink.platform, "w-4 h-4")}
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
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                                                required
                                            />
                                            {newLink.url && (
                                                <div className="absolute right-3 text-xs text-indigo-400 font-medium animate-in fade-in slide-in-from-left-1">
                                                    {newLink.platform}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Title Input */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Button Title</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Listen on Spotify"
                                            value={newLink.title}
                                            onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? 'Adding...' : 'Add to Profile'}
                                </button>
                            </form>

                            {/* Links List */}
                            <div className="space-y-3">
                                {links.map((link) => (
                                    <div key={link.id} className="group flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                                        <div className="text-slate-500 cursor-move">
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
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

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
            </div>
        </Layout>
    );
};

export default ProfilePage;
