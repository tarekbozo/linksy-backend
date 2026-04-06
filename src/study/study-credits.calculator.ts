export enum StudyAction {
  CHAT = "chat",
  SUMMARY = "summary",
  EXPLAIN = "explain",
  QUESTIONS = "questions",
  KEYPOINTS = "keypoints",
  FULL_PACK = "full_pack",
  AUDIO_TRANSCRIBE = "audio_transcribe",
}

type TextSize = "small" | "medium" | "large" | "xlarge";

function getTextSize(textLength: number): TextSize {
  if (textLength < 3000) return "small";
  if (textLength < 8000) return "medium";
  if (textLength < 20000) return "large";
  return "xlarge";
}

export function calculateStudyCredits(
  action: StudyAction,
  textLength: number,
  audioDurationSeconds?: number,
): number {
  if (action === StudyAction.CHAT) return 1;

  if (action === StudyAction.AUDIO_TRANSCRIBE) {
    const dur = audioDurationSeconds ?? 0;
    if (dur < 60) return 5;
    if (dur < 300) return 20;
    if (dur < 600) return 50;
    return 100;
  }

  const size = getTextSize(textLength);

  if (action === StudyAction.FULL_PACK) {
    const costs: Record<TextSize, number> = {
      small: 25,
      medium: 35,
      large: 45,
      xlarge: 60,
    };
    return costs[size];
  }

  // SUMMARY, EXPLAIN, QUESTIONS, KEYPOINTS
  const costs: Record<TextSize, number> = {
    small: 5,
    medium: 10,
    large: 20,
    xlarge: 35,
  };
  return costs[size];
}
