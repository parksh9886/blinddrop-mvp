
import { useState } from 'react';
import { User, Lock, Send } from 'lucide-react';
import Layout from '../components/Layout';

// --- MOCK DATA ---
const MOCK_FEEDBACKS = [
    {
        id: '1',
        content: "Beats are fire but the vocals utilize too much autotune for my taste. Maybe dial it back a bit?",
        created_at: new Date().toISOString(),
        reply: null,
        is_unlocked: true, // Already unlocked, needs reply
        track_id: 't1',
        vibe_energy: 80,
        vibe_mood: 20,
        vibe_style: 90,
        situations: ['Driving', 'Gym', 'Party'],
        isAccessible: true,
        mockIsOwner: true // SIMULATE ARTIST VIEW
    },
    {
        id: '2',
        content: "I think the mix is a bit muddy in the low end. Kick and bass are clashing.",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        reply: "Thanks for the feedback! I'll check the EQ on the bass.",
        is_unlocked: true,
        track_id: 't1',
        vibe_energy: 40,
        vibe_mood: 60,
        vibe_style: 50,
        situations: ['Study', 'Chill'],
        isAccessible: true,
        mockIsOwner: true
    },
    {
        id: '3',
        content: "This is a locked feedback example. You shouldn't see this text if logic was real, but for design we show it with blur state.",
        created_at: new Date(Date.now() - 172800000).toISOString(),
        reply: null,
        is_unlocked: false,
        track_id: 't1',
        isAccessible: false,
        mockIsOwner: true
    }
];

// --- HELPERS ---
const getSituationEmoji = (situation: string) => {
    const map: Record<string, string> = {
        'Driving': '🚗',
        'Gym': '💪',
        'Party': '🎉',
        'Study': '📚',
        'Chill': '☕',
        'Work': '💼',
        'Dance': '💃',
        'Running': '🏃',
        'Gaming': '🎮',
        'Sleep': '💤',
        'Morning': '🌅',
        'Late Night': '🌙',
    };
    return map[situation] || '🏷️';
};

const VibeSlider = ({ value, leftLabel, rightLabel, leftColor, rightColor }: { value: number, leftLabel: string, rightLabel: string, leftColor: string, rightColor: string }) => {
    const isLeft = value < 50;
    const isRight = value > 50;
    const intensity = Math.abs(value - 50) / 50;

    return (
        <div className="flex flex-col gap-1 w-full">
            <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase transition-all duration-300">
                <span style={{
                    color: isLeft ? leftColor : '#64748b',
                    opacity: isLeft ? 0.5 + (0.5 * intensity) : 0.4,
                    textShadow: (isLeft && intensity > 0.6) ? `0 0 8px ${leftColor}` : 'none'
                }}>
                    {leftLabel}
                </span>
                <span style={{
                    color: isRight ? rightColor : '#64748b',
                    opacity: isRight ? 0.5 + (0.5 * intensity) : 0.4,
                    textShadow: (isRight && intensity > 0.6) ? `0 0 8px ${rightColor}` : 'none'
                }}>
                    {rightLabel}
                </span>
            </div>
            <div className="relative h-2 bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
                <div
                    className="absolute inset-0 opacity-80"
                    style={{
                        background: `linear-gradient(to right, 
                            ${isLeft ? leftColor : 'transparent'} 0%, 
                            transparent 50%, 
                            ${isRight ? rightColor : 'transparent'} 100%)`
                    }}
                />
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 -translate-x-1/2" />
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10 transition-all duration-500 ease-out"
                    style={{ left: `calc(${value}% - 5px)` }}
                />
            </div>
        </div>
    );
};

// --- PROTOTYPE COMPONENT ---
const PrototypeFeedbackItem = ({ feedback }: { feedback: any }) => {
    const { isAccessible, content, created_at, reply, situations, vibe_energy, vibe_mood, vibe_style, mockIsOwner, is_unlocked } = feedback;
    const shouldBlur = !isAccessible;

    // Simulate input state for demo
    const [inputValue, setInputValue] = useState("");

    return (
        <div className={`relative mb-8 group ${shouldBlur ? 'opacity-60' : ''}`}>
            {/* User Feedback Bubble */}
            <div className={`
                relative p-5 rounded-3xl rounded-bl-none
                bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/5
                backdrop-blur-xl shadow-xl transition-all duration-300
            `}>
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`
                            w-9 h-9 rounded-full flex items-center justify-center 
                            bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-inner
                        `}>
                            <User className="w-4 h-4 text-white/70" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white tracking-wide">Anonymous</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest">
                                {new Date(created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {!shouldBlur && (
                    <div className="mb-5 space-y-4">
                        {situations && situations.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {situations.map((s: string, i: number) => (
                                    <span key={i} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10 flex items-center gap-1.5 hover:bg-white/10 transition-colors cursor-default">
                                        <span>{getSituationEmoji(s)}</span>
                                        <span>{s}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                        {(vibe_energy !== undefined) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                                <VibeSlider value={vibe_energy} leftLabel="Calm" rightLabel="Hype" leftColor="#2dd4bf" rightColor="#f43f5e" />
                                <VibeSlider value={vibe_mood} leftLabel="Dark" rightLabel="Bright" leftColor="#8b5cf6" rightColor="#fbbf24" />
                                <VibeSlider value={vibe_style} leftLabel="Popular" rightLabel="Unique" leftColor="#3b82f6" rightColor="#d946ef" />
                            </div>
                        )}
                    </div>
                )}

                <div className={`text-sm leading-relaxed text-white/90 pl-1 ${shouldBlur ? 'blur-sm select-none grayscale opacity-50' : ''}`}>
                    {content}
                </div>

                {/* Unlock Overlay */}
                {shouldBlur && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 rounded-3xl overflow-hidden">
                        <div className="bg-slate-900/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-2xl flex items-center gap-2 transform transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                            <Lock className="w-4 h-4 text-white" />
                            <span className="text-xs font-bold text-white">Unlock to Read</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ARTIST ACTION AREA */}
            {/* If there is a reply, show the reply bubble */}
            {reply ? (
                <div className="relative mt-2 ml-auto w-[90%] md:w-[85%] animate-in fade-in slide-in-from-bottom-2">
                    <div className="relative bg-[#1e293b] p-5 rounded-3xl rounded-tr-none border border-slate-700/50 shadow-lg">
                        <div className="flex items-center justify-start gap-3 mb-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                                You
                            </div>
                            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Artist Reply</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed text-left pl-1">
                            {reply}
                        </p>
                    </div>
                </div>
            ) : (
                // If NO reply, but IS owner and unlocked -> Show Input Field
                mockIsOwner && is_unlocked ? (
                    <div className="relative mt-2 ml-auto w-[90%] md:w-[85%] animate-in fade-in slide-in-from-bottom-2">
                        <div className="relative bg-black/40 p-1.5 rounded-3xl rounded-tr-none border border-slate-700/50 shadow-lg flex items-center gap-2 group focus-within:border-indigo-500/50 focus-within:bg-black/60 transition-all duration-300">

                            {/* Avatar (You) */}
                            <div className="pl-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                                    You
                                </div>
                            </div>

                            {/* Input Field */}
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type a reply..."
                                className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-0 px-2 py-3"
                            />

                            {/* Send Action */}
                            <button
                                className={`
                                    p-3 rounded-full transition-all duration-300 flex items-center justify-center
                                    ${inputValue.length > 0
                                        ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] rotate-0 scale-100 hover:scale-110 active:scale-95'
                                        : 'bg-white/5 text-slate-600 scale-90 hover:bg-white/10'
                                    }
                                `}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : null
            )}
        </div>
    );
};

const DesignSandboxPage = () => {
    return (
        <Layout>
            <div className="min-h-screen bg-slate-950 pt-24 px-4 pb-20">
                <div className="max-w-md mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold text-white">UI Sandbox</h1>
                        <p className="text-slate-500 text-sm">Artist Reply Input Prototype</p>
                    </div>

                    <div className="space-y-8 p-4 border border-dashed border-slate-800 rounded-2xl bg-black/20">
                        {MOCK_FEEDBACKS.map(fb => (
                            <PrototypeFeedbackItem key={fb.id} feedback={fb} />
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DesignSandboxPage;
