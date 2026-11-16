/** Whole seconds as minutes and seconds, such as 3:05. */
export function formatTimeSurvived(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}
