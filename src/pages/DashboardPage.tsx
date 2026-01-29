import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { Loader2, Link as LinkIcon, Music, Ghost, Share2, PlusCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [handle, setHandle] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalTracks: 0,
        profileVisits: 0,
        linkClicks: 0
    });
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                // Fetch User Handle
                const { data: userData } = await supabase
                    .from('users')
                    .select('handle')
                    .eq('id', user.id)
                    .single();

                if (userData) setHandle(userData.handle);

                // Fetch Tracks Count
                const { count, error } = await supabase
                    .from('tracks')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (error) throw error;

                setStats(prev => ({
                    ...prev,
                    totalTracks: count || 0
                }));

            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    const handleCopyProfileLink = () => {
        if (!handle) return;
        const url = `${window.location.origin}/u/${handle}`;
        navigator.clipboard.writeText(url).then(() => {
            setToast({ message: 'Profile link copied to clipboard!', type: 'success' });
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
                    {toast.type === 'success' ? <LinkIcon className="w-4 h-4" /> : <Ghost className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            <div className="max-w-5xl mx-auto space-y-12">

                {/* 1. Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Welcome Back!
                        </h1>
                        <p className="text-slate-400 mt-1">Here is what's happening with your music today.</p>
                    </div>
                    {handle && (
                        <button
                            onClick={handleCopyProfileLink}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
                        >
                            <Share2 className="w-4 h-4" />
                            Share Profile
                        </button>
                    )}
                </div>

                {/* 2. Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Tracks */}
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Music className="w-24 h-24 text-indigo-500" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-slate-400 text-sm font-medium mb-1">Total Tracks</p>
                            <h3 className="text-4xl font-bold text-white">{stats.totalTracks}</h3>
                        </div>
                    </div>

                    {/* Profile Visits (Placeholder) */}
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden opacity-70">
                        <div className="relative z-10">
                            <p className="text-slate-400 text-sm font-medium mb-1">Profile Visits</p>
                            <h3 className="text-4xl font-bold text-white">0</h3>
                            <p className="text-xs text-slate-600 mt-2">Coming Soon</p>
                        </div>
                    </div>

                    {/* Link Clicks (Placeholder) */}
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden opacity-70">
                        <div className="relative z-10">
                            <p className="text-slate-400 text-sm font-medium mb-1">Link Clicks</p>
                            <h3 className="text-4xl font-bold text-white">0</h3>
                            <p className="text-xs text-slate-600 mt-2">Coming Soon</p>
                        </div>
                    </div>
                </div>

                {/* 3. Quick Actions */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <Link to="/tracks" className="group bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 hover:border-indigo-500/50 p-6 rounded-2xl flex items-center justify-between transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                    <PlusCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-200 transition-colors">Upload New Track</h3>
                                    <p className="text-sm text-slate-400">Add a new demo or finished track.</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                        </Link>

                        <Link to="/profile" className="group bg-slate-900/50 border border-slate-800 hover:border-slate-600 p-6 rounded-2xl flex items-center justify-between transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                                    <Ghost className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">Edit Profile</h3>
                                    <p className="text-sm text-slate-400">Update your bio, handle, or avatar.</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                        </Link>

                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default DashboardPage;
