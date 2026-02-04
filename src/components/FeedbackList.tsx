import React from 'react';
import { User, Lock } from 'lucide-react';
import { useFeedbackLogic } from '../hooks/useFeedbackLogic';
import type { Feedback } from '../hooks/useFeedbackLogic';

interface FeedbackListProps {
    feedbacks: Feedback[] | undefined;
    isOwner: boolean;
    onReply: (feedbackId: string, trackId: string, content: string) => void;
    onUnlock: (feedbackId: string, trackId: string) => void;
    trackId: string;
}

const FeedbackItem = ({
    feedback,
    isOwner,
    onReply,
    onUnlock,
    trackId
}: {
    feedback: Feedback & { isAccessible: boolean };
    isOwner: boolean;
    onReply: (fid: string, tid: string, content: string) => void;
    onUnlock: (fid: string, tid: string) => void;
    trackId: string;
}) => {
    const { isAccessible, content, created_at, reply, id } = feedback;
    const shouldBlur = !isAccessible;

    return (
        <div className={`p-5 rounded-2xl border-b border-white/5 transition-all relative ${shouldBlur ? 'bg-black/20 overflow-hidden' : 'bg-transparent'}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${!shouldBlur ? 'bg-gradient-to-br from-white/10 to-white/5 text-white shadow-inner border border-white/5' : 'bg-white/5 text-white/20'}`}>
                    <User className="w-4 h-4" />
                </div>
                <div>
                    <div className={`text-sm font-bold tracking-tight ${shouldBlur ? 'text-white/30' : 'text-white'}`}>Anonymous</div>
                    <div className={`text-[10px] uppercase tracking-wider ${shouldBlur ? 'text-white/20' : 'text-white/30'}`}>
                        {new Date(created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {!shouldBlur && (
                <div className="bg-black/20 rounded-xl p-4 mb-4 border border-white/5">
                    {/* Situation Tags (Minimal Chips) */}
                    {feedback.situations && feedback.situations.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {feedback.situations.map((s, i) => (
                                <span key={i} className="text-[10px] bg-white/5 text-white/70 px-2.5 py-1 rounded-full border border-white/10 transition-colors hover:bg-white/10 hover:border-white/20">
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Vibe Visualizer (Mini Progress Bar) */}
                    {(feedback.vibe_energy != null || feedback.vibe_mood != null || feedback.vibe_style != null) && (
                        <div className="space-y-3 pt-1">
                            {[
                                { val: feedback.vibe_energy, left: 'Calm', right: 'Hype' }, // Changed to Hype as in example
                                { val: feedback.vibe_mood, left: 'Dark', right: 'Bright' },
                                { val: feedback.vibe_style, left: 'Popular', right: 'Unique' }
                            ].map((v, idx) => {
                                if (v.val == null) return null;
                                // val is 0-100.
                                // Rendering a track line and a dot at `val`%
                                return (
                                    <div key={idx} className="flex items-center gap-3">
                                        <span className="text-[10px] text-gray-500 font-medium w-8 text-right">{v.left}</span>
                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full relative flex items-center">
                                            {/* Track Line (optional decorative) - styling simplified as background */}
                                            {/* Dot */}
                                            <div
                                                className="absolute h-2.5 w-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] border border-white/20"
                                                style={{ left: `calc(${v.val}% - 5px)` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-medium w-8">{v.right}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Content (Text Comment) */}
            <p className={`text-sm leading-relaxed mb-4 pl-1 ${shouldBlur ? 'text-white/20 blur-sm select-none pointer-events-none' : 'text-white/80'}`}>
                {content}
            </p>

            {/* Action Area */}
            {reply ? (
                // Has Reply
                <div className="mt-2 pl-4 border-l-2 border-indigo-500/30 bg-indigo-500/5 rounded-r-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 box-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Artist Reply</p>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">{reply}</p>
                </div>
            ) : (
                // No Reply
                isOwner ? (
                    isAccessible ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const input = form.elements.namedItem('reply') as HTMLInputElement;
                                onReply(id, trackId, input.value);
                                form.reset();
                            }}
                            className="mt-3 flex gap-2"
                        >
                            <input
                                name="reply"
                                type="text"
                                placeholder="Write a reply..."
                                className="flex-1 bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-all font-medium"
                                required
                            />
                            <button type="submit" className="bg-white/5 hover:bg-white/10 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/5 active:scale-95">
                                Send
                            </button>
                        </form>
                    ) : (
                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                            <button
                                onClick={() => onUnlock(id, trackId)}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all border border-white/10 shadow-2xl active:scale-95 group"
                            >
                                <Lock className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                                <span>Unlock Feedback</span>
                            </button>
                        </div>
                    )
                ) : (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md text-white/40 px-5 py-2 rounded-full text-[10px] font-bold border border-white/5 uppercase tracking-widest shadow-xl">
                            <Lock className="w-3 h-3" /> Hidden Content
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export const FeedbackList: React.FC<FeedbackListProps> = ({
    feedbacks,
    isOwner,
    onReply,
    onUnlock,
    trackId
}) => {
    const { displayFeedbacks } = useFeedbackLogic(feedbacks, isOwner);

    return (
        <div className="space-y-4">
            {displayFeedbacks.length > 0 ? (
                displayFeedbacks.map((fb) => (
                    <FeedbackItem
                        key={fb.id}
                        feedback={fb}
                        isOwner={isOwner}
                        onReply={onReply}
                        onUnlock={onUnlock}
                        trackId={trackId}
                    />
                ))
            ) : (
                <div className="text-center py-8 text-white/20 text-xs font-medium border border-dashed border-white/5 rounded-xl bg-white/5 uppercase tracking-widest">
                    {isOwner ? "No feedback yet." : "Be the first to share your thoughts"}
                </div>
            )}
        </div>
    );
};
