export type DiffChange = {
    value: string;
    added?: boolean;
    removed?: boolean;
};

export function diffWords(oldStr: string, newStr: string): DiffChange[] {
    const oldWords = oldStr.split(/(\s+)/);
    const newWords = newStr.split(/(\s+)/);

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
