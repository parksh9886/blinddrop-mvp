import React, { useState } from 'react';
import { User, CheckCircle2, Lock } from 'lucide-react';
import { useFeedbackLogic, Feedback } from '../hooks/useFeedbackLogic';

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
        <div className={`p-4 rounded-xl border transition-all relative ${shouldBlur ? 'bg-slate-900/50 border-slate-800/50 overflow-hidden' : 'bg-slate-950 border-slate-800'}`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${!shouldBlur ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    <User className="w-3 h-3" />
                </div>
                <span className={`text-xs font-bold ${shouldBlur ? 'text-slate-600' : 'text-slate-400'}`}>Anonymous</span>
                <span className={`text-[10px] ml-auto ${shouldBlur ? 'text-slate-700' : 'text-slate-600'}`}>
                    {new Date(created_at).toLocaleDateString()}
                </span>
            </div>

            {/* Content */}
            <p className={`text-sm leading-relaxed mb-2 transition-all ${shouldBlur ? 'text-slate-600 blur-sm select-none pointer-events-none' : 'text-slate-300'}`}>
                {content}
            </p>

            {/* Action Area */}
            {reply ? (
                // Has Reply (Always visible if isAccessible OR isOwner seeing their own reply history)
                <div className="mt-3 pl-3 border-l-2 border-indigo-500 bg-indigo-500/5 rounded-r-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                        <p className="text-xs text-indigo-300 font-bold">Artist Reply</p>
                    </div>
                    <p className="text-sm text-slate-400">{reply}</p>
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
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                required
                            />
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                Reply
                            </button>
                        </form>
                    ) : (
                        // Not Accessible: Unlock Button
                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                            <button
                                onClick={() => onUnlock(id, trackId)}
                                className="flex items-center gap-2 bg-slate-800/90 hover:bg-indigo-600/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-700 hover:border-indigo-500 shadow-xl"
                            >
                                <Lock className="w-4 h-4" /> Unlock to View
                            </button>
                        </div>
                    )
                ) : (
                    // VISITOR VIEW (Locked)
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md text-white/70 px-4 py-2 rounded-xl text-xs font-bold border border-white/5">
                            <Lock className="w-3 h-3" /> Waiting for artist's reply
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
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Placeholder submit handler (Actual submission logic should be passed down or handled here if we want to move API calls)
    // For now, let's keep the API call in the parent or assume onReply handles it? 
    // Wait, the "New Feedback" form is usually separate. 
    // In ArtistPublicPage, there was a form to add feedback.
    // In TracksPage, there isn't usually a form to add feedback (User creates tracks, doesn't feedback themselves usually, but maybe for testing).

    // Let's assume this component JUST lists them, but for ArtistPublicPage we need the input form.
    // To make it truly reusable, we might want to optionally include the input form or just let the parent handle it.
    // Given the prompt "FeedbackList (or FeedbackSection)", it usually implies the whole section.
    // Let's include the "Add Feedback" logic BUT only if it's NOT the owner (Visitors write feedback).
    // Or if we want to allow the owner to write feedback to themselves for testing?

    // Actually, `onReply` is for replying to existing feedback. 
    // We need an `onAddFeedback` prop if we want to include the input form.
    // I check the ArtistPublicPage code: it has `<FeedbackSection>` which includes the form.
    // TracksPage doesn't have the form.

    // Let's make the input form optional or part of the parent. 
    // However, to fully replace `FeedbackSection` in `ArtistPublicPage`, we should probably handle it or let parent pass a "header" or "footer".
    // Let's stick to the LIST for now, and let `ArtistPublicPage` keep the form above the list, OR add `onAddFeedback` prop.

    // Decision: Keep it simple. Just the list. The input form can be outside in `ArtistPublicPage`.
    // Wait, the prompt said "UI 컴포넌트 분리 (FeedbackList.tsx)... 역할: 피드백 데이터 배열을 받아 정렬 로직을 처리하고, 디자인(UI)을 일관되게 렌더링함."
    // It doesn't explicitly say "Input Form". But `ArtistPublicPage` has it. 
    // I will exclude the "New Feedback Input" from this list component to keep it focused on *displaying* the list.
    // `ArtistPublicPage` can render the input form above this list.

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
                <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                    {isOwner ? "No feedback yet." : "Be the first to leave feedback!"}
                </div>
            )}
        </div>
    );
};
