import type { EmploymentType } from '@/types/jobs';

export type RecruiterVoiceDraft = {
  jobTitle?: string;
  employmentType?: EmploymentType;
  seniority?: string;
  candidateName?: string;
  candidateEmail?: string;
  location?: string;
  wantsInterview?: boolean;
};

export type RecruiterVoiceParse = {
  draft: RecruiterVoiceDraft;
  reset: boolean;
};

const EMPLOYMENT_TYPES: Array<[RegExp, EmploymentType]> = [
  [/\b(?:internship|intern)\b/i, 'internship'],
  [/\b(?:part[ -]?time)\b/i, 'part_time'],
  [/\b(?:contract|freelance)\b/i, 'contract'],
  [/\b(?:temporary|temp)\b/i, 'temporary'],
  [/\b(?:full[ -]?time)\b/i, 'full_time'],
];

function clean(value?: string) {
  return value?.replace(/\b(?:candidate|email|mail|difficulty|seniority|level|location|city)\b.*$/i, '')
    .replace(/^(?:for|role|job|position)\s+/i, '')
    .replace(/\s+/g, ' ').trim().replace(/[,.]+$/g, '');
}

function normalizedEmail(text: string) {
  const direct = text.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/i)?.[0];
  if (direct) return direct.toLowerCase();
  const spokenSource = text.match(/(?:email|mail)\s+([a-z0-9.!#$%&'*+/=?^_`{|}~\-\s]+?)(?=\s*(?:,|difficulty|seniority|level|location|city|$))/i)?.[1] ?? text;
  const spoken = spokenSource.toLowerCase()
    .replace(/\s+at\s+/g, '@')
    .replace(/\s+dot\s+/g, '.')
    .replace(/\s+/g, '');
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(spoken) ? spoken : undefined;
}

function seniority(text: string) {
  if (/\b(?:intern|internship|fresher|graduate|0\s*(?:years?|yr))\b/i.test(text)) return 'intern';
  if (/\b(?:junior|entry[ -]?level|1\s*(?:years?|yr))\b/i.test(text)) return 'junior';
  if (/\b(?:mid|mid[ -]?level|2[- ]?4\s*(?:years?|yr))\b/i.test(text)) return 'mid-level';
  if (/\b(?:senior|lead|staff|5\+?\s*(?:years?|yr))\b/i.test(text)) return 'senior';
  return undefined;
}

function titleFrom(text: string) {
  const beforeInterview = text.match(/^\s*(.+?)\s+(?:ke liye|ke lie|for)\s+(?:an?\s+)?(?:interview|job|role)\b/i)?.[1];
  const afterInterview = text.match(/(?:create|make|generate|banao|banado|banaye)\s+(?:an?\s+)?(?:job|interview|role)(?:\s+for)?\s+(.+?)(?=\s+(?:candidate|email|mail|difficulty|seniority|level|location|city)\b|$)/i)?.[1];
  const explicitRole = text.match(/(?:role(?: is)?|position(?: is)?|opening(?: is)?|interview for)\s+(.+?)(?=\s+(?:candidate|email|mail|difficulty|seniority|level|location|city)\b|$)/i)?.[1];
  return clean(beforeInterview ?? afterInterview ?? explicitRole);
}

function candidateNameFrom(text: string) {
  const match = text.match(/(?:candidate(?: name)?|naam|name)\s+(?:is\s+)?(.+?)(?=\s+(?:email|mail|difficulty|seniority|level|for|in|at)\b|$)/i);
  return clean(match?.[1]);
}

function locationFrom(text: string) {
  const match = text.match(/(?:location|city|in|at)\s+([a-z][a-z .-]{1,70})(?=$|\s+(?:candidate|email|mail|difficulty|seniority|level)\b)/i);
  return clean(match?.[1]);
}

/**
 * Extracts recruiter-supplied slots from English or Hindi-English speech. It is
 * intentionally conservative: names and titles are only retained when marked
 * by a clear phrase, so an unrelated sentence cannot create a job.
 */
export function parseRecruiterVoiceCommand(text: string, current: RecruiterVoiceDraft = {}): RecruiterVoiceParse {
  const reset = /\b(?:cancel|start over|reset|chhodo|cancel karo)\b/i.test(text);
  if (reset) return { draft: {}, reset: true };

  const next: RecruiterVoiceDraft = { ...current };
  const title = titleFrom(text);
  const name = candidateNameFrom(text);
  const email = normalizedEmail(text);
  const level = seniority(text);
  const location = locationFrom(text);
  const employment = EMPLOYMENT_TYPES.find(([pattern]) => pattern.test(text))?.[1];

  if (title && title.length >= 2) next.jobTitle = title;
  if (name && name.length >= 2) next.candidateName = name;
  if (email) next.candidateEmail = email;
  if (level) next.seniority = level;
  if (location && location.length >= 2 && !/^(?:the|a|an)$/i.test(location)) next.location = location;
  if (employment) next.employmentType = employment;
  if (/\b(?:create|make|generate|banao|banado|banaye|start)\b/i.test(text)
    && /\b(?:job|interview|link|invite|invitation|role|position)\b/i.test(text)) next.wantsInterview = true;

  return { draft: next, reset: false };
}

export function missingRecruiterVoiceFields(draft: RecruiterVoiceDraft) {
  const missing: Array<keyof RecruiterVoiceDraft> = [];
  if (!draft.jobTitle) missing.push('jobTitle');
  if (!draft.seniority) missing.push('seniority');
  if (!draft.candidateName) missing.push('candidateName');
  if (!draft.candidateEmail) missing.push('candidateEmail');
  return missing;
}

export function recruiterVoicePrompt(draft: RecruiterVoiceDraft) {
  const missing = missingRecruiterVoiceFields(draft);
  if (!missing.length) return `I have the role ${draft.jobTitle}, ${draft.seniority} level, and candidate ${draft.candidateName}. Creating the interview link now.`;
  const question = missing[0] === 'jobTitle'
    ? 'Kaunse role ke liye interview banana hai?'
    : missing[0] === 'seniority'
      ? 'Difficulty ya seniority bataiye: intern, junior, mid-level, ya senior?'
      : missing[0] === 'candidateName'
        ? 'Candidate ka full name kya hai?'
        : 'Candidate ka email address kya hai?';
  return `${question} Aap Hindi, English, ya Hinglish mein bol sakte hain.`;
}
