import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, ArrowRight, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../i18n';

const LandingPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (user) navigate('/dashboard'); // Handled by DashboardRedirect
    }, [user, navigate]);
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />

            {/* Nav removed for landing (clean minimal hero) */}

            <main className="w-full mx-auto px-6 z-10 flex flex-col items-center">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="px-4 md:px-0"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
                            <Zap className="w-3 h-3" /> {t('landing.mvp')}
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white mb-6">
                            {t('landing.headline')}
                        </h1>
                        <p className="text-base md:text-lg text-slate-400 mb-8 max-w-xl">
                            {t('landing.description')}
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <Link to="/login" className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white font-semibold rounded-full shadow-lg transition transform-gpu duration-150">
                                {t('common.startButton')}
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            <Link to="/design-sandbox" className="inline-flex items-center gap-2 px-4 py-3 border border-slate-800 text-slate-200 rounded-full hover:bg-white/5 transition">
                                {t('common.signIn')}
                            </Link>
                        </div>

                        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FeatureCard icon={<Shield className="w-6 h-6 text-indigo-400" />} title={t('landing.features.anonymous.title')} desc={t('landing.features.anonymous.desc')} />
                            <FeatureCard icon={<Music className="w-6 h-6 text-pink-400" />} title={t('landing.features.platform.title')} desc={t('landing.features.platform.desc')} />
                            <FeatureCard icon={<Zap className="w-6 h-6 text-yellow-400" />} title={t('landing.features.engagement.title')} desc={t('landing.features.engagement.desc')} />
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="px-4 md:px-0">
                        {/* Minimal waveform artwork */}
                        <div className="w-full h-64 md:h-80 lg:h-96 bg-gradient-to-br from-slate-900/60 to-slate-800/60 rounded-2xl border border-white/5 flex items-center justify-center">
                            <svg width="90%" height="70%" viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="g1" x1="0" x2="1">
                                        <stop offset="0%" stopColor="#6366F1" />
                                        <stop offset="100%" stopColor="#F472B6" />
                                    </linearGradient>
                                </defs>
                                <path d="M0 100 C 50 80, 150 120, 200 100 C 250 80, 350 120, 400 100 C 450 80, 550 120, 600 100 C 650 80, 750 120, 800 100" stroke="url(#g1)" strokeWidth="6" fill="none" strokeLinecap="round" />
                            </svg>
                        </div>
                    </motion.div>
                </div>
            </main>

            <footer className="absolute bottom-6 text-slate-500 text-sm">
                &copy; {new Date().getFullYear()} Blindrop. Built for musicians.
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:border-slate-700 transition">
        <div className="mb-4">{icon}</div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
)

export default LandingPage;
