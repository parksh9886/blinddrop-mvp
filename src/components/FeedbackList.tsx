import React from 'react';
import { User, CheckCircle2, Lock } from 'lucide-react';
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
        <div className={`p-4 rounded-xl border-b border-white/5 transition-all relative ${shouldBlur ? 'bg-black/20 overflow-hidden' : 'bg-transparent'}`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${!shouldBlur ? 'bg-white/10 text-white' : 'bg-white/5 text-white/20'}`}>
                    <User className="w-3 h-3" />
                </div>
                <span className={`text-xs font-bold ${shouldBlur ? 'text-white/30' : 'text-white/60'}`}>Anonymous</span>
                <span className={`text-[10px] ml-auto ${shouldBlur ? 'text-white/20' : 'text-white/40'}`}>
                    {new Date(created_at).toLocaleDateString()}
                </span>
            </div>

            {/* Content */}
            <p className={`text-sm leading-relaxed mb-3 transition-all ${shouldBlur ? 'text-white/20 blur-sm select-none pointer-events-none' : 'text-white/80'}`}>
                {content}
            </p>

            {!shouldBlur && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {/* Situation Tags */}
                    {feedback.situations && feedback.situations.map((s, i) => (
                        <span key={i} className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-bold border border-white/5">
                            #{s}
                        </span>
                    ))}

                    {/* Vibe Indicators (Simplified) */}
                    {(feedback.vibe_energy !== undefined || feedback.vibe_mood !== undefined || feedback.vibe_style !== undefined) && (
                        <div className="flex gap-2 items-center ml-1">
                            {feedback.vibe_energy !== undefined && (
                                <div className="flex items-center gap-1" title="Energy">
                                    <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-white/40" style={{ width: `${feedback.vibe_energy}%` }} />
                                    </div>
                                    <span className="text-[8px] text-white/30 font-black">E</span>
                                </div>
                            )}
                            {feedback.vibe_mood !== undefined && (
                                <div className="flex items-center gap-1" title="Mood">
                                    <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-white/40" style={{ width: `${feedback.vibe_mood}%` }} />
                                    </div>
                                    <span className="text-[8px] text-white/30 font-black">M</span>
                                </div>
                            )}
                            {feedback.vibe_style !== undefined && (
                                <div className="flex items-center gap-1" title="Style">
                                    <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-white/40" style={{ width: `${feedback.vibe_style}%` }} />
                                    </div>
                                    <span className="text-[8px] text-white/30 font-black">S</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Action Area */}
            {reply ? (
                // Has Reply (Always visible if isAccessible OR isOwner seeing their own reply history)
                <div className="mt-3 pl-3 border-l-2 border-indigo-400 bg-indigo-500/10 rounded-r-lg p-3">
                    <div className="flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                        <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Artist Reply</p>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">{reply}</p>
                </div>
            ) : (
                // No Reply
                isOwner ? (
                    // OWNER VIEW
                    isAccessible ? (
                        // Accessible: Can Reply
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
                                placeholder="Reply to unlock for public..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all font-medium"
                                required
                            />
                            <button type="submit" className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/10 active:scale-95">
                                Reply
                            </button>
                        </form>
                    ) : (
                        // Not Accessible: Unlock Button
                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                            <button
                                onClick={() => onUnlock(id, trackId)}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/10 shadow-2xl active:scale-95"
                            >
                                <Lock className="w-4 h-4" /> Unlock to View
                            </button>
                        </div>
                    )
                ) : (
                    // VISITOR VIEW (Locked)
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md text-white/50 px-4 py-2 rounded-xl text-[10px] font-bold border border-white/5 uppercase tracking-widest">
                            <Lock className="w-3 h-3" /> Waiting for response
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
