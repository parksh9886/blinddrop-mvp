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
    const { isAccessible, content, created_at, reply, id } = feedback;
    const shouldBlur = !isAccessible;
    const [inputValue, setInputValue] = useState("");

    const hasReplyOrInput = reply || (isOwner && isAccessible);

    return (
        <div className={`relative mb-6 group ${shouldBlur ? 'opacity-50' : ''}`}>
            {/* THREAD CONNECTOR LINE (L-Shape) */}
            {hasReplyOrInput && (
                <div
                    className="absolute left-[1.125rem] top-10 bottom-[2.5rem] w-6 border-l border-b border-white/20 rounded-bl-2xl pointer-events-none"
                    aria-hidden="true"
                />
            )}

            <div className="flex gap-4">
                {/* LEFT: Avatar Column */}
                <div className="flex-shrink-0 relative z-10">
                    <div className={`
                        w-9 h-9 rounded-full flex items-center justify-center 
                        bg-white/5 border border-white/10 shadow-sm backdrop-blur-sm
                    `}>
                        <User className="w-4 h-4 text-white/50" />
                    </div>
                </div>

                {/* RIGHT: Content Column */}
                <div className="flex-1 min-w-0 pb-6 border-b border-white/5 last:border-0">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white/90">Anonymous</span>
                                {shouldBlur && (
                                    <Lock className="w-3 h-3 text-white/30" />
                                )}
                            </div>
                            <div className="text-[10px] text-white/30 font-medium tracking-wide">
                                {new Date(created_at).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Status Badges */}
                        {!shouldBlur && reply && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                <MessageCircle className="w-3 h-3 text-indigo-400" />
                                <span className="text-[10px] font-bold text-indigo-300">Replied</span>
                            </div>
                        )}
                    </div>

                    {/* Main Content Text */}
                    <div className="relative">
                        <p className={`text-sm leading-relaxed text-slate-300 ${shouldBlur ? 'blur-sm select-none' : ''}`}>
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
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {reply ? (
                                /* ARTIST REPLY UI */
                                <div className="relative pl-4 border-l-2 border-indigo-500/50">
                                    <div className="bg-indigo-500/5 p-3 rounded-r-xl rounded-bl-sm">
                                        {/* Header */}
                                        <div className="flex items-center gap-2 mb-1.5">
                                            {artistProfileImage ? (
                                                <img
                                                    src={artistProfileImage}
                                                    alt="Artist"
                                                    className="w-4 h-4 rounded-full object-cover ring-1 ring-indigo-500/50"
                                                />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                                    <span className="text-[8px] text-white font-bold">A</span>
                                                </div>
                                            )}
                                            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Artist Reply</span>
                                        </div>
                                        {/* Reply Text */}
                                        <p className="text-sm text-indigo-50/90 leading-relaxed">
                                            {reply}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* INPUT FIELD UI (Line Style) */
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (!inputValue.trim()) return;
                                        onReply(id, trackId, inputValue);
                                        setInputValue("");
                                    }}
                                    className="relative flex items-end gap-3"
                                >
                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                                    </div>

                                    <div className="flex-1 relative group/input">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Write a reply..."
                                            className="w-full bg-transparent border-b border-white/20 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-400/50 transition-colors"
                                        />
                                        {/* Focus Glow Effect */}
                                        <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-indigo-500 transition-all duration-300 group-focus-within/input:w-full" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim()}
                                        className={`
                                            p-2 rounded-full transition-all duration-300 
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

