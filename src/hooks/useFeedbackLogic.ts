import { useMemo } from 'react';

export interface Feedback {
    id: string;
    content: string;
    created_at: string;
    reply: string | null;
    is_unlocked: boolean;
    track_id: string;
    vibe_energy?: number;
    vibe_mood?: number;
    vibe_style?: number;
    situations?: string[];
}

export const useFeedbackLogic = (feedbacks: Feedback[] | undefined, isOwner: boolean) => {

    // 1. Sort by Created Date Ascending (Absolute Rank for "First 3")
    const sortedByDate = useMemo(() => {
        if (!feedbacks) return [];
        return [...feedbacks].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }, [feedbacks]);

    // 2. Assign Visibility & Accessibility Logic
    const processedFeedbacks = useMemo(() => {
        return sortedByDate.map((fb, index) => {
            let isAccessible = false;

            if (isOwner) {
                // Owner Logic:
                // Accessible if it's in the First 3 (index 0, 1, 2) OR explicitly unlocked
                isAccessible = index < 3 || fb.is_unlocked;
            } else {
                // Visitor Logic:
                // Accessible only if it has a reply (Artist interaction)
                isAccessible = !!fb.reply;
            }

            return {
                ...fb,
                isAccessible
            };
        });
    }, [sortedByDate, isOwner]);

    // 3. Final Display Sort (Accessible First)
    const displayFeedbacks = useMemo(() => {
        return [...processedFeedbacks].sort((a, b) => {
            // Priority: Accessible items first
            if (a.isAccessible !== b.isAccessible) {
                return a.isAccessible ? -1 : 1;
            }
            // Secondary: Date Ascending (Oldest First)
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    }, [processedFeedbacks]);

    return {
        displayFeedbacks
    };
};
