export type DiffChange = {
    value: string;
    added?: boolean;
    removed?: boolean;
};

export function normalizeText(text: string): string {
    if (!text) return '';
    let normalized = text;

    // Try to parse as JSON if it looks like a JSON object string
    if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
        try {
            const parsed = JSON.parse(text);
            if (typeof parsed === 'object' && parsed !== null) {
                // Common keys for content
                normalized = parsed.text || parsed.content || parsed.body || text;
            }
        } catch (e) {
            // Not partial JSON or malformed, continue with raw text
        }
    }

    // Handle literal \n or \r\n characters which might appear in some db records/imports
    // and convert them back to actual control characters for rendering
    return normalized
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');
}

export function diffWords(oldStr: string, newStr: string): DiffChange[] {
    const s1 = normalizeText(oldStr);
    const s2 = normalizeText(newStr);
    const oldWords = s1.split(/(\s+)/);
    const newWords = s2.split(/(\s+)/);

    const matrix: number[][] = Array(oldWords.length + 1)
        .fill(null)
        .map(() => Array(newWords.length + 1).fill(0));

    for (let i = 1; i <= oldWords.length; i++) {
        for (let j = 1; j <= newWords.length; j++) {
            if (oldWords[i - 1] === newWords[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1] + 1;
            } else {
                matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
            }
        }
    }

    const result: DiffChange[] = [];
    let i = oldWords.length;
    let j = newWords.length;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
            result.unshift({ value: oldWords[i - 1] });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
            result.unshift({ value: newWords[j - 1], added: true });
            j--;
        } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
            result.unshift({ value: oldWords[i - 1], removed: true });
            i--;
        }
    }

    // Merge consecutive changes of the same type
    const mergedResult: DiffChange[] = [];
    if (result.length > 0) {
        let current = result[0];
        for (let k = 1; k < result.length; k++) {
            const next = result[k];
            if (current.added === next.added && current.removed === next.removed) {
                current.value += next.value;
            } else {
                mergedResult.push(current);
                current = next;
            }
        }
        mergedResult.push(current);
    }

    return mergedResult;
}
