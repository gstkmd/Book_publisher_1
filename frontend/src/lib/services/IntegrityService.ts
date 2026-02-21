import { api } from '../api';

export interface PlagiarismMatch {
    url: string;
    title: string;
    percentage: number;
    matched_text: string;
}

export interface IntegrityReport {
    ai_score: number | null;
    plagiarism_matches: PlagiarismMatch[] | null;
    summary: string;
}

export const IntegrityService = {
    checkFull: async (contentId: string, options: { checkAI: boolean, checkCopyright: boolean }, token: string): Promise<IntegrityReport> => {
        return api.post('/integrity/verify/full', {
            content_id: contentId,
            check_ai: options.checkAI,
            check_copyright: options.checkCopyright
        }, token);
    },

    checkPartial: async (snippet: string, options: { checkAI: boolean, checkCopyright: boolean }, token: string): Promise<IntegrityReport> => {
        return api.post('/integrity/verify/partial', {
            snippet,
            check_ai: options.checkAI,
            check_copyright: options.checkCopyright
        }, token);
    }
};
