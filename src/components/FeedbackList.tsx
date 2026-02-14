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
    artistName?: string;
}

const FeedbackItem = ({
    feedback,
    isOwner,
    onReply,
    onUnlock,
    trackId,
    artistProfileImage,
    artistName
}: {
    feedback: Feedback & { isAccessible: boolean };
    isOwner: boolean;
    onReply: (fid: string, tid: string, content: string) => void;
    onUnlock: (fid: string, tid: string) => void;
    trackId: string;
    artistProfileImage?: string | null;
    artistName?: string;
}) => {
    const { isAccessible, content, created_at, reply, id } = feedback;
    const shouldBlur = !isAccessible;
    const [inputValue, setInputValue] = useState("");

    const hasReplyOrInput = reply || (isOwner && isAccessible);

    return (
        <div className={`relative mb-6 group ${shouldBlur ? 'opacity-50' : ''}`}>
            {/* THREAD CONNECTOR LINE (Reddit Style: Avatar-to-Avatar) */}
            {hasReplyOrInput && (
                <div
                    className="absolute left-[1.125rem] top-9 bottom-[1.625rem] w-9 border-l border-b border-white/5 rounded-bl-2xl pointer-events-none"
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
                                {isOwner ? (
                                    <button
                                        onClick={() => onUnlock(id, trackId)}
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
                                <div className="flex items-start gap-4">
                                    {/* Reply Avatar (Target of Line) */}
                                    <div className="flex-shrink-0 relative z-10">
                                        {artistProfileImage ? (
                                            <img
                                                src={artistProfileImage}
                                                alt={artistName || "Artist"}
                                                className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-indigo-500/80 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                                <span className="text-[10px] text-white font-bold">
                                                    {artistName ? artistName.charAt(0).toUpperCase() : "A"}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Reply Content */}
                                    <div className="flex-1 pt-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[11px] font-bold text-indigo-300">
                                                {artistName || "Artist"}
                                            </span>
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
                                        if (!inputValue.trim()) return;
                                        onReply(id, trackId, inputValue);
                                        setInputValue("");
                                    }}
                                    className="flex items-start gap-4"
                                >
                                    {/* Input Avatar (Now uses Artist Avatar logic) */}
                                    <div className="flex-shrink-0 relative z-10">
                                        {artistProfileImage ? (
                                            <img
                                                src={artistProfileImage}
                                                alt={artistName || "Artist"}
                                                className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 shadow-sm grayscale opacity-70"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                                <span className="text-[10px] text-indigo-300 font-bold">
                                                    {artistName ? artistName.charAt(0).toUpperCase() : "A"}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 relative group/input pt-1">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder={`Reply as ${artistName || 'Artist'}...`}
                                            className="w-full bg-transparent border-b border-white/20 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-400/50 transition-colors"
                                        />
                                        <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-indigo-500 transition-all duration-300 group-focus-within/input:w-full" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim()}
                                        className={`
                                            p-2 rounded-full transition-all duration-300 mt-0.5
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

export const FeedbackList = React.memo<FeedbackListProps>(({
    feedbacks,
    isOwner,
    onReply,
    onUnlock,
    trackId,
    artistProfileImage,
    artistName
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
                        artistName={artistName}
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

