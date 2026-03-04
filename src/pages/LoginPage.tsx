import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Music, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(false);

    useEffect(() => {
        // Parse returnUrl from query params
        const params = new URLSearchParams(window.location.search);
        const returnUrl = params.get('returnUrl') || '/dashboard'; // Let dashboard redirect to /u/:handle

        // Check if user is already logged in
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate(returnUrl);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) navigate(returnUrl);
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleGoogleLogin = async () => {
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in:', error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-10 mx-4"
            >
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4">
                        <Music className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Welcome to BlindDrop</h1>
                    <p className="text-slate-400 mt-2 text-sm">Sign in to start receiving feedback on your music.</p>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </>
                    )}
                </button>

                <p className="mt-6 text-center text-xs text-slate-500">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </motion.div>
        </div>
    );
};

export default LoginPage;
