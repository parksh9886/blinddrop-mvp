import { useMemo } from 'react';

export interface Feedback {
    id: string;
    content: string;
    created_at: string;
    reply: string | null;
    is_unlocked: boolean;
    track_id: string;
}

export const useFeedbackLogic = (feedbacks: Feedback[] | undefined, isOwner: boolean) => {

    // 1. Sort by Created Date Descending (Absolute Rank)
    const sortedByDate = useMemo(() => {
        if (!feedbacks) return [];
        return [...feedbacks].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }, [feedbacks]);

    // 2. Assign Visibility & Accessibility Logic
    const processedFeedbacks = useMemo(() => {
        return sortedByDate.map((fb, index) => {
            let isAccessible = false;

            if (isOwner) {
                // Owner Logic:
                // Accessible if it's in the Top 3 (index 0, 1, 2) OR explicitly unlocked
                // Note: index IS the absolute rank because we sorted by date above
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
            // Secondary: Date Descending (maintain relative order)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [processedFeedbacks]);

    return {
        displayFeedbacks
    };
};
