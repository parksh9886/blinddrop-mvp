import React, { useState } from 'react';
import { User, Lock, MessageCircle, Send } from 'lucide-react';
import { useFeedbackLogic } from '../hooks/useFeedbackLogic';
import type { Feedback } from '../hooks/useFeedbackLogic';

interface FeedbackListProps {
    feedbacks: Feedback[] | undefined;
    isOwner: boolean;
    onReply: (feedbackId: string, trackId: string, content: string) => void;
    onUnlock: (feedbackId: string, trackId: string) => void;
    trackId: string;
    artistProfileImage?: string | null;
}

// --- HELPERS from DesignSandbox ---
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
                    opacity: isLeft ? 0.4 + (0.6 * intensity) : 0.4,
                    textShadow: isLeft ? `0 0 ${intensity * 10}px ${leftColor}` : 'none',
                    transform: isLeft ? `scale(${1 + intensity * 0.1})` : 'scale(1)'
                }} className="transition-all duration-300">
                    {leftLabel}
                </span>
                <span style={{
                    color: isRight ? rightColor : '#64748b',
                    opacity: isRight ? 0.4 + (0.6 * intensity) : 0.4,
                    textShadow: isRight ? `0 0 ${intensity * 10}px ${rightColor}` : 'none',
                    transform: isRight ? `scale(${1 + intensity * 0.1})` : 'scale(1)'
                }} className="transition-all duration-300">
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

const FeedbackItem = ({
    feedback,
    isOwner,
    onReply,
    onUnlock,
    trackId,
    artistProfileImage
}: {
    feedback: Feedback & { isAccessible: boolean };
    isOwner: boolean;
    onReply: (fid: string, tid: string, content: string) => void;
    onUnlock: (fid: string, tid: string) => void;
    trackId: string;
    artistProfileImage?: string | null;
}) => {
    const { isAccessible, content, created_at, reply, id, situations, vibe_energy, vibe_mood, vibe_style } = feedback;
    const shouldBlur = !isAccessible;
    const [inputValue, setInputValue] = useState("");

    return (
        <div className={`relative mb-8 group ${shouldBlur ? 'opacity-60' : ''}`}>
            {/* User Feedback Bubble */}
            <div className={`
                relative p-5 rounded-3xl rounded-bl-none
                bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/5
                backdrop-blur-xl shadow-xl transition-all duration-300
            `}>
                {/* Header: Avatar & Date */}
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

                    {/* Icons */}
                    {shouldBlur ? (
                        <div className="bg-black/40 px-2.5 py-1 rounded-full border border-white/5">
                            <Lock className="w-3 h-3 text-white/40" />
                        </div>
                    ) : reply ? (
                        <div className="bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/30">
                            <MessageCircle className="w-3 h-3 text-indigo-400" />
                        </div>
                    ) : null}
                </div>

                {/* Vibe & Situations - Only Visible if NOT Blurred */}
                {!shouldBlur && (
                    <div className="mb-5 space-y-4">
                        {/* 1. Situation Tags with Emojis */}
                        {situations && situations.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {situations.map((s, i) => (
                                    <span key={i} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10 flex items-center gap-1.5 hover:bg-white/10 transition-colors cursor-default">
                                        <span>{getSituationEmoji(s)}</span>
                                        <span>{s}</span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* 2. Bidirectional Gradient Sliders */}
                        {(vibe_energy != null || vibe_mood != null || vibe_style != null) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                                {vibe_energy != null && (
                                    <VibeSlider
                                        value={vibe_energy}
                                        leftLabel="Calm" rightLabel="Hype"
                                        leftColor="#2dd4bf"
                                        rightColor="#f43f5e"
                                    />
                                )}
                                {vibe_mood != null && (
                                    <VibeSlider
                                        value={vibe_mood}
                                        leftLabel="Dark" rightLabel="Bright"
                                        leftColor="#8b5cf6"
                                        rightColor="#fbbf24"
                                    />
                                )}
                                {vibe_style != null && (
                                    <VibeSlider
                                        value={vibe_style}
                                        leftLabel="Popular" rightLabel="Unique"
                                        leftColor="#3b82f6"
                                        rightColor="#d946ef"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Main Content */}
                <div className={`
                    text-sm leading-relaxed text-white/90 pl-1
                    ${shouldBlur ? 'blur-sm select-none grayscale opacity-50' : ''}
                `}>
                    {content}
                </div>

                {/* Lock Overlay */}
                {shouldBlur && (
                    // Visitor Logic: If hidden, they can't do anything (unless we add 'Request Unlock' later, but for now just 'Hidden')
                    // Owner Logic: Can 'Unlock'
                    <div className="absolute inset-0 flex items-center justify-center z-10 rounded-3xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />

                        {isOwner ? (
                            <button
                                onClick={() => onUnlock(id, trackId)}
                                className="bg-slate-900/90 hover:bg-slate-800/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-2xl flex items-center gap-2 transform transition-transform hover:scale-105 active:scale-95 cursor-pointer group"
                            >
                                <Lock className="w-4 h-4 text-white group-hover:text-indigo-400 transition-colors" />
                                <span className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors">Unlock Feedback</span>
                            </button>
                        ) : (
                            <div className="bg-slate-900/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-2xl flex items-center gap-2">
                                <Lock className="w-4 h-4 text-white/50" />
                                <span className="text-xs font-bold text-white/50">Details Hidden</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ARTIST ACTION AREA */}
            {reply ? (
                <div className="relative mt-2 ml-auto w-[90%] md:w-[85%] animate-in fade-in slide-in-from-bottom-2">
                    <div className="relative bg-[#1e293b] p-5 rounded-3xl rounded-tr-none border border-slate-700/50 shadow-lg">
                        <div className="flex items-center justify-start gap-3 mb-2">
                            {artistProfileImage ? (
                                <img
                                    src={artistProfileImage}
                                    alt="Artist"
                                    className="w-6 h-6 rounded-full object-cover shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-white/10"
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                                    You
                                </div>
                            )}
                            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Artist Reply</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed text-left pl-1">
                            {reply}
                        </p>
                    </div>
                </div>
            ) : (
                // If NO reply, but IS owner and unlocked -> Show NEW Input Field Design
                isOwner && isAccessible ? (
                    <div className="relative mt-2 ml-auto w-[90%] md:w-[85%] animate-in fade-in slide-in-from-bottom-2">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!inputValue.trim()) return;
                                onReply(id, trackId, inputValue);
                                setInputValue(""); // Clear local input
                            }}
                            className="relative bg-black/40 p-1.5 rounded-3xl rounded-tr-none border border-slate-700/50 shadow-lg flex items-center gap-2 group focus-within:border-indigo-500/50 focus-within:bg-black/60 transition-all duration-300"
                        >
                            {/* Avatar (You) */}
                            <div className="pl-2">
                                {artistProfileImage ? (
                                    <img
                                        src={artistProfileImage}
                                        alt="You"
                                        className="w-8 h-8 rounded-full object-cover shadow-lg border border-white/10"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                                        You
                                    </div>
                                )}
                            </div>

                            {/* Input Field */}
                            <input
                                type="text"
                                name="reply"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type a reply..."
                                className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-0 px-2 py-3"
                                autoComplete="off"
                            />

                            {/* Send Action */}
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className={`
                                    p-3 rounded-full transition-all duration-300 flex items-center justify-center
                                    ${inputValue.trim().length > 0
                                        ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] rotate-0 scale-100 hover:scale-110 active:scale-95'
                                        : 'bg-white/5 text-slate-600 scale-90 hover:bg-white/10'
                                    }
                                `}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                ) : null
            )}
        </div>
    );
};

export const FeedbackList = React.memo<FeedbackListProps>(({
    feedbacks,
    isOwner,
    onReply,
    onUnlock,
    trackId,
    artistProfileImage
}) => {
    const { displayFeedbacks } = useFeedbackLogic(feedbacks, isOwner);
    const [filter, setFilter] = React.useState<'all' | 'unreplied'>('all');

    const filteredFeedbacks = displayFeedbacks.filter(fb => {
        if (filter === 'unreplied') return !fb.reply;
        return true;
    });

    return (
        <div className="space-y-4">
            {/* Filter Tabs (Owner Only) */}
            {isOwner && (
                <div className="flex gap-2 mb-4 justify-end">
                    <span className="text-xs text-white/30 font-medium mr-2 self-center uppercase tracking-widest">Filter:</span>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 text-[10px] font-bold rounded-full transition-all uppercase tracking-wider border ${filter === 'all'
                            ? 'bg-white text-black border-white'
                            : 'bg-transparent text-white/40 border-white/10 hover:border-white/20'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('unreplied')}
                        className={`px-4 py-1.5 text-[10px] font-bold rounded-full transition-all uppercase tracking-wider border ${filter === 'unreplied'
                            ? 'bg-indigo-500 text-white border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                            : 'bg-transparent text-white/40 border-white/10 hover:border-white/20'
                            }`}
                    >
                        Unreplied
                    </button>
                </div>
            )}

            {filteredFeedbacks.length > 0 ? (
                filteredFeedbacks.map((fb) => (
                    <FeedbackItem
                        key={fb.id}
                        feedback={fb}
                        isOwner={isOwner}
                        onReply={onReply}
                        onUnlock={onUnlock}
                        trackId={trackId}
                        artistProfileImage={artistProfileImage}
                    />
                ))
            ) : (
                <div className="text-center py-12 px-6 rounded-3xl bg-black/20 border border-dashed border-slate-700/50">
                    <MessageCircle className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-medium">
                        {filter === 'unreplied' ? "All caught up! No unreplied feedback." : (isOwner ? "No feedback yet." : "Be the first to share your thoughts")}
                    </p>
                </div>
            )}
        </div>
    );
});

