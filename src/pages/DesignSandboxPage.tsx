
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


// --- PROTOTYPE COMPONENT ---
const PrototypeFeedbackItem = ({ feedback }: { feedback: any }) => {
    const { isAccessible, content, created_at, reply, mockIsOwner, is_unlocked } = feedback;
    const shouldBlur = !isAccessible;
    const [inputValue, setInputValue] = useState("");

    const hasReplyOrInput = reply || (mockIsOwner && is_unlocked);

    return (
        <div className={`relative mb-6 group ${shouldBlur ? 'opacity-50' : ''}`}>
            {/* THREAD CONNECTOR LINE (Reddit Style: Avatar-to-Avatar) */}
            {hasReplyOrInput && (
                <div
                    className="absolute left-[1.125rem] top-9 bottom-[1.75rem] w-8 border-l-2 border-b-2 border-white/10 rounded-bl-2xl pointer-events-none"
                    aria-hidden="true"
                />
            )}

            <div className="flex gap-4">
                {/* LEFT: Parent Avatar (Anchor) */}
                <div className="flex-shrink-0 relative z-10">
                    <div className={`
                        w-9 h-9 rounded-full flex items-center justify-center 
                        bg-white/5 border border-white/10 shadow-sm backdrop-blur-sm
                    `}>
                        <User className="w-4 h-4 text-white/50" />
                    </div>
                </div>

                {/* RIGHT: Content Column */}
                <div className="flex-1 min-w-0 pb-2">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white/90">Anonymous</span>
                            {shouldBlur && <Lock className="w-3 h-3 text-white/30" />}
                            <span className="text-[10px] text-white/30 font-medium tracking-wide">
                                • {new Date(created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Main Content Text */}
                    <div className="relative mb-3">
                        <p className={`text-sm font-medium leading-relaxed text-gray-100 ${shouldBlur ? 'blur-sm select-none' : ''}`}>
                            {content}
                        </p>

                        {/* Lock Overlay */}
                        {shouldBlur && (
                            <div className="absolute inset-0 flex items-center justify-center -top-2">
                                {mockIsOwner ? (
                                    <button
                                        className="bg-black/40 hover:bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2 transition-all hover:scale-105"
                                    >
                                        <Lock className="w-3 h-3 text-white" />
                                        <span className="text-xs font-bold text-white">Unlock</span>
                                    </button>
                                ) : (
                                    <span className="text-xs text-slate-500 italic">... Hidden Content ...</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* NESTED: Artist Reply or Input */}
                    {hasReplyOrInput && (
                        <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                            {reply ? (
                                /* ARTIST REPLY UI (Avatar Connected) */
                                <div className="flex items-start gap-3">
                                    {/* Reply Avatar (Target of Line) */}
                                    <div className="flex-shrink-0 relative z-10 pt-1">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/80 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                            <span className="text-[9px] text-white font-bold">A</span>
                                        </div>
                                    </div>

                                    {/* Reply Content */}
                                    <div className="flex-1 pt-0.5">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[11px] font-bold text-indigo-300">Artist Reply</span>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            {reply}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* INPUT FIELD UI (Connected) */
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        setInputValue("");
                                    }}
                                    className="flex items-start gap-3"
                                >
                                    {/* Input Avatar (You) */}
                                    <div className="flex-shrink-0 pt-1.5">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                                        </div>
                                    </div>

                                    <div className="flex-1 relative group/input">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Write a reply..."
                                            className="w-full bg-transparent border-b border-white/20 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-400/50 transition-colors"
                                        />
                                        <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-indigo-500 transition-all duration-300 group-focus-within/input:w-full" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim()}
                                        className={`
                                            p-2 rounded-full transition-all duration-300 mt-1
                                            ${inputValue.trim()
                                                ? 'text-indigo-400 hover:text-white hover:bg-indigo-500'
                                                : 'text-white/10 cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
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
