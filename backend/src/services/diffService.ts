// Extremely simple diff service to simulate the paper's Help Fix Code line tracking
export const generateDiff = (original: string, corrected: string) => {
  const origLines = original.split('\n');
  const corrLines = corrected.split('\n');
  
  const diffs = [];
  const maxLen = Math.max(origLines.length, corrLines.length);
  
  for (let i = 0; i < maxLen; i++) {
    if (origLines[i] !== corrLines[i]) {
      diffs.push({
        lineIndex: i,
        originalLine: origLines[i] || '',
        correctedLine: corrLines[i] || '',
        status: !origLines[i] ? 'added' : !corrLines[i] ? 'removed' : 'changed'
      });
    }
  }
  return diffs;
};
