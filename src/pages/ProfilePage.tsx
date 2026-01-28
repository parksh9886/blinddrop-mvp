import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { Save, Loader2, User as UserIcon, Camera, AlertTriangle } from 'lucide-react';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [handle, setHandle] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [originalHandle, setOriginalHandle] = useState('');

    const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

    // Fetch Profile
    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            try {
                // Try fetching from 'users' table as requested
                const { data, error } = await supabase
                    .from('users')
                    .select('handle, bio, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
                    console.error('Error fetching profile:', error);
                }

                if (data) {
                    setHandle(data.handle || '');
                    setOriginalHandle(data.handle || '');
                    setBio(data.bio || '');
                    setAvatarUrl(data.avatar_url || user.user_metadata.avatar_url);
                } else {
                    // Fallback to auth metadata if no profile row exists
                    setAvatarUrl(user.user_metadata.avatar_url);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

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
            setMsg({ type: 'success', text: 'Image uploaded! Remember to click Save to persist changes.' });
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
        // Allow only lowercase, numbers, underscores, dots
        if (/^[a-z0-9_.]*$/.test(val)) {
            setHandle(val);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
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

            // Upsert Profile
            const updates = {
                id: user.id,
                handle,
                bio,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('users')
                .upsert(updates);

            if (error) throw error;

            // Sync with Auth Metadata (for Navbar)
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
                <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8">

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

                    <form onSubmit={handleSave} className="space-y-6">

                        {/* Handle Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Handle</label>
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
                            <p className="mt-2 text-xs text-slate-500">Only lowercase letters, numbers, underscores, and dots.</p>

                            {/* Handle Change Warning */}
                            {originalHandle && handle !== originalHandle && (
                                <div className="mt-3 flex items-start gap-2 text-amber-400 bg-amber-500/10 p-3 rounded-lg text-xs leading-relaxed border border-amber-500/20">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Warning:</strong> Changing your handle will break your existing profile links. You will need to share the new link again.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Bio Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                                placeholder="Tell us about yourself..."
                                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                            />
                            <div className="mt-1 text-right text-xs text-slate-500">
                                {bio.length}/160
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
                </div>
            </div>
        </Layout>
    );
};

export default ProfilePage;
