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
        if (user) navigate('/dashboard');
    }, [user, navigate]);
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />

            <nav className="absolute top-0 w-full p-6 flex justify-between items-center max-w-6xl">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                    <Music className="w-6 h-6 text-indigo-400" />
                    <span>BlindDrop</span>
                </div>
                <Link to="/login" className="px-5 py-2 rounded-full border border-slate-700 hover:bg-slate-800 transition text-sm font-medium">
                    {t('common.signIn')}
                </Link>
            </nav>

            <main className="max-w-4xl mx-auto text-center px-6 z-10 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
                        <Zap className="w-3 h-3" /> {t('landing.mvp')}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                        {t('landing.headline')}
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                        {t('landing.description')}
                    </p>

                    <Link
                        to="/login"
                        className="group relative inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-full transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]"
                    >
                        {t('common.startButton')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="grid md:grid-cols-3 gap-6 mt-20 text-left"
                >
                    <FeatureCard
                        icon={<Shield className="w-6 h-6 text-indigo-400" />}
                        title={t('landing.features.anonymous.title')}
                        desc={t('landing.features.anonymous.desc')}
                    />
                    <FeatureCard
                        icon={<Music className="w-6 h-6 text-pink-400" />}
                        title={t('landing.features.platform.title')}
                        desc={t('landing.features.platform.desc')}
                    />
                    <FeatureCard
                        icon={<Zap className="w-6 h-6 text-yellow-400" />}
                        title={t('landing.features.engagement.title')}
                        desc={t('landing.features.engagement.desc')}
                    />
                </motion.div>
            </main>

            <footer className="absolute bottom-6 text-slate-500 text-sm">
                &copy; {new Date().getFullYear()} BlindDrop. Built for musicians.
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
