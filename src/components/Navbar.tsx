import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Music, LogOut, User, Menu, LayoutDashboard, Globe, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Profile State
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [handle, setHandle] = useState<string | null>(null);

    // Fetch Profile Data on Mount
    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            try {
                // Try fetching from 'users' table
                const { data } = await supabase
                    .from('users')
                    .select('handle, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setHandle(data.handle);
                    setAvatarUrl(data.avatar_url || user.user_metadata.avatar_url);
                } else {
                    setAvatarUrl(user.user_metadata.avatar_url);
                }
            } catch (err) {
                console.error('Error loading navbar profile:', err);
            }
        };

        fetchProfile();
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        setIsDropdownOpen(false);
        navigate('/');
    };

    // Click Outside to Close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo Logic: Guest -> Home, User -> Dashboard */}
                    <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-bold text-xl tracking-tighter text-white hover:opacity-80 transition-opacity">
                        <Music className="w-6 h-6 text-indigo-400" />
                        <span>BlindDrop</span>
                    </Link>

                    {/* Right Side Menu */}
                    <div className="flex items-center">
                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                {/* Hamburger Trigger: Avatar + Menu Icon */}
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-3 p-1.5 rounded-full hover:bg-white/5 transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden border border-indigo-500/30 group-hover:border-indigo-400 transition-colors">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-4 h-4 text-indigo-400" />
                                        )}
                                    </div>
                                    <Menu className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {isDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.1 }}
                                            className="absolute right-0 top-full mt-3 w-56 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5"
                                        >
                                            <div className="p-1 space-y-1">

                                                {/* Dashboard */}
                                                <Link
                                                    to="/dashboard"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                                                >
                                                    <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                                                    Dashboard
                                                </Link>

                                                {/* My Artist Page (Only if handle exists) */}
                                                {handle && (
                                                    <Link
                                                        to={`/u/${handle}`}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                                                    >
                                                        <Globe className="w-4 h-4 text-pink-400" />
                                                        My Artist Page
                                                    </Link>
                                                )}

                                                {/* Settings */}
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                                                >
                                                    <Settings className="w-4 h-4 text-slate-400" />
                                                    Settings
                                                </Link>

                                                <div className="h-px bg-white/10 my-1 mx-2" />

                                                {/* Sign Out */}
                                                <button
                                                    onClick={handleSignOut}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            // Guest: Login Button
                            <Link
                                to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`}
                                className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
