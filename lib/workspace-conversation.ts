import { interviewStore } from '@/lib/interview-store';
import type { InterviewSessionRecord } from '@/types/interview';
import { advanceDemoWorkspace } from '@/lib/demo-turns';
import { canvasReviewObservation, checkpointObservation, codeTaskReview } from '@/lib/workspace-observation';

export type WorkspaceCommand = 'code' | 'canvas' | 'tests' | 'review' | 'help' | 'skip';

export function workspaceCommand(answer: string): WorkspaceCommand | null {
  if (answer.split(/\s+/).length > 20) return null;
  if (/\b(?:run|execute) (?:the |my )?tests\b/i.test(answer)) return 'tests';
  if (/^(?:please )?(?:next|move on|skip)(?: (?:please|this|the task|this task))?[.! ]*$/i.test(answer)) return 'skip';
  if (/\b(?:open|show|switch to) (?:the |my )?(?:code editor|ide|editor)\b/i.test(answer)) return 'code';
  if (/\b(?:open|show|switch to) (?:the |my )?(?:canvas|whiteboard|diagram)\b/i.test(answer)) return 'canvas';
  if (/\b(?:review|check|see|look at) (?:the |my )?(?:code|diagram|canvas|checkpoint|design)(?: now)?\b/i.test(answer)) return 'review';
  if (/\b(?:can you see|(?:i(?:'ve| have)? )?shared (?:the |my )?checkpoint)\b/i.test(answer)) return 'review';
  // Candidates commonly say this immediately after editing. Treat it as a
  // request to inspect the latest autosave, not as a scored answer.
  if (/^(?:i )?(?:updated|done|finished)(?: (?:it|the |my )?(?:code|diagram|canvas|design))?(?:,? please)?[.! ]*$/i.test(answer)) return 'review';
  // STT regularly renders "now" as "no" at the end of a short command.
  // Treat that harmless variant as a review request rather than an answer.
  if (/^(?:please |now )?(?:see|review|check)(?: (?:it|my (?:code|diagram|canvas|checkpoint)))?(?: (?:now|no))?(?:,? please)?[.! ]*$/i.test(answer)) return 'review';
  if (/\b(?:can i|may i|could i)\b.{0,30}\b(?:python|javascript|typescript|java script|type script)\b/i.test(answer)) return 'help';
  if (/\b(?:how (?:should|do) i|give me (?:a )?hint|any (?:idea|hint)|what should i (?:draw|write|do)|help me (?:with|design|implement|draw))\b/i.test(answer)) return 'help';
  if (/^(?:i )?(?:understand|understood|got it|okay|ok)[.! ]*$/i.test(answer)) return 'help';
  return null;
}

export function workspaceHelpText(session: InterviewSessionRecord, utterance: string): string {
  const asksLanguage = /\b(?:can i|may i|could i)\b.{0,30}\b(?:python|javascript|typescript|java script|type script)\b/i.test(utterance);
  const acknowledgesTask = /^(?:i )?(?:understand|understood|got it|okay|ok)[.! ]*$/i.test(utterance);
  const requestedLanguage = utterance.match(/\b(python|javascript|typescript|java script|type script)\b/i)?.[1]
    ?.replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? 'that language';
  if (asksLanguage) {
    return `Of course. You can use ${requestedLanguage}; choose it in the editor and keep the requested function name. The panel evaluates your reasoning and the saved implementation, not a preferred language.`;
  }
  if (acknowledgesTask) {
    return 'Great. Take your time, write the smallest clear solution, and say check now when you want a grounded review.';
  }
  if (session.currentModality === 'canvas') {
    return 'Start with three labelled boxes: Client, API Server, and Database. Draw an arrow from Client to API Server, then to Database, and explain that responses return through the API to the client. Keep the diagram simple, then say check now.';
  }
  const question = (session.pendingQuestion ?? '').toLocaleLowerCase();
  if (/count[_\s]*vowels|countvowels|number of vowels/.test(question)) {
    return 'Hint: begin a count at zero, examine each character, and count it only when its lowercase form is one of a, e, i, o, or u. Return the count; an empty string naturally returns zero.';
  }
  if (/sort(?:ed|ing)?|ascending/.test(question)) {
    return 'Hint: define one function that accepts the list and returns the values in ascending order. You may use the language’s built-in sort, but make sure the function returns the sorted list and consider an empty list.';
  }
  if (/sum.*even|even numbers/.test(question)) {
    return 'Hint: start with zero, inspect each number, add it only when it is divisible by two, then return the total. An empty list should leave the total at zero.';
  }
  return 'Start by naming the function, identify its input and return value, then implement the smallest clear solution. Mention one edge case such as empty input when you explain it.';
}

export async function respondToWorkspaceCommand(session: InterviewSessionRecord, command: WorkspaceCommand, requestId: string, utterance = '') {
  const events = await interviewStore.listEvents(session.id);
  const cached = events.find((event) => event.type === 'workspace.voice_response' && event.payload.requestId === requestId);
  if (cached) return String(cached.payload.text);
  if (utterance.trim()) {
    await interviewStore.createTurn({
      sessionId: session.id,
      speaker: 'candidate',
      speakerRole: null,
      text: utterance.slice(0, 12_000),
      status: 'final',
      dedupeKey: `workspace-candidate:${requestId}`,
    });
  }
  let text: string;
  if (command === 'skip') {
    const attempts = events.filter((event) => event.type === 'workspace.attempt').length + 1;
    await interviewStore.appendEvent(session.id, 'workspace.attempt', { requestId, kind: 'skip_requested', attempt: attempts });
    if (attempts < 3) {
      text = `That is okay. I have recorded attempt ${attempts} of 3. Try one small step, explain your approach, or say next please again when you are ready to leave this workspace task.`;
    } else {
      const version = await interviewStore.getInterviewVersion(session.interviewVersionId);
      const next = version?.definition.demoMode
        ? await advanceDemoWorkspace({ session, upstreamTurnId: `workspace-skip:${requestId}`, outcome: 'skipped' })
        : '';
      text = `No problem. I will retain only the work you saved and mark this workspace task as incomplete for human review. ${next}`;
    }
  } else if (command === 'code' || command === 'canvas') {
    const fresh = (await interviewStore.getSession(session.id))!;
    await interviewStore.updateSession(session.id, { currentModality: command, stateVersion: fresh.stateVersion + 1 }, fresh.stateVersion);
    text = `The ${command === 'code' ? 'code editor' : 'design canvas'} is open. I can review your autosaved work when you say check now.`;
  } else {
    let observation: string | null = null;
    let workspaceComplete = false;
    let reviewIsCode = false;
    if (command === 'review') {
      const artifacts = await Promise.all([interviewStore.getArtifact(session.id, 'code'), interviewStore.getArtifact(session.id, 'canvas')]);
      const asksForCanvas = /\b(?:canvas|diagram|whiteboard|drawing)\b/i.test(utterance);
      const asksForCode = /\b(?:code|editor|ide)\b/i.test(utterance);
      const preferred = asksForCanvas ? 1 : asksForCode ? 0 : session.currentModality === 'code' ? 0 : 1;
      reviewIsCode = preferred === 0;
      if (reviewIsCode) {
        const review = codeTaskReview(artifacts[0]?.content, session.pendingQuestion ?? '');
        observation = review?.text ?? null;
        workspaceComplete = review?.complete ?? false;
      } else {
        observation = canvasReviewObservation(artifacts[1]?.content);
        workspaceComplete = Boolean(observation?.includes('both required data-flow connections') || observation?.includes('complete architecture flow'));
      }
      observation ??= checkpointObservation(artifacts[preferred]?.content, reviewIsCode ? 'code' : 'canvas');
      if (!observation) {
        observation = reviewIsCode
          ? 'I cannot see any saved code in the editor yet. Add the requested function, wait for autosave, then say check now.'
          : 'I can see the canvas is still blank—nothing has been saved there yet. Draw the Client, API Server, and Database boxes, connect them with arrows, then say check now.';
      }
    }
    if (command === 'help') {
      text = workspaceHelpText(session, utterance);
    } else if (command === 'tests') {
      text = 'Code execution is not part of this interview. Say check now and I will review the implementation you saved.';
    } else if (command === 'review' && workspaceComplete) {
      const version = await interviewStore.getInterviewVersion(session.interviewVersionId);
      const next = version?.definition.demoMode
        ? await advanceDemoWorkspace({ session, upstreamTurnId: `workspace-review:${requestId}`, outcome: 'completed' })
        : '';
      text = `${observation ?? 'I reviewed your workspace.'}${next ? ` Let’s move to the next panel perspective. ${next}` : ' This completes the workspace portion.'}`;
    } else {
      text = command === 'review'
        ? `${observation ?? 'I received your workspace.'} Update it, then say check now for another review.`
        : 'Code execution is not part of this interview. Say check now and I will review the implementation you saved.';
    }
  }
  await interviewStore.createTurn({
    sessionId: session.id,
    speaker: 'interviewer',
    speakerRole: session.activeRole,
    text,
    status: 'final',
    dedupeKey: `workspace-agent:${requestId}`,
  });
  await interviewStore.appendEvent(session.id, 'workspace.voice_response', { requestId, command, text });
  return text;
}

/** Record natural workspace explanations without treating them as scored answers. */
export async function respondToWorkspaceAttempt(session: InterviewSessionRecord, requestId: string, utterance: string) {
  const events = await interviewStore.listEvents(session.id);
  const cached = events.find((event) => event.type === 'workspace.voice_response' && event.payload.requestId === requestId);
  if (cached) return String(cached.payload.text);
  const attempts = events.filter((event) => event.type === 'workspace.attempt').length + 1;
  await interviewStore.createTurn({
    sessionId: session.id,
    speaker: 'candidate',
    speakerRole: null,
    text: utterance.slice(0, 12_000),
    status: 'final',
    dedupeKey: `workspace-candidate:${requestId}`,
  });
  await interviewStore.appendEvent(session.id, 'workspace.attempt', { requestId, kind: 'spoken_explanation', attempt: attempts, text: utterance.slice(0, 500) });
  const modality = session.currentModality === 'canvas' ? 'diagram' : 'code';
  const text = attempts >= 3
    ? `I heard your explanation and recorded your saved ${modality} as incomplete. If you cannot continue, say next please and I will move to the next perspective without claiming this task was complete.`
    : `I understand your approach. This is attempt ${attempts} of 3. Keep working from the task on screen; I can assess only saved ${modality}, not an explanation alone. Say next please if you want to leave it incomplete.`;
  await interviewStore.createTurn({
    sessionId: session.id,
    speaker: 'interviewer',
    speakerRole: session.activeRole,
    text,
    status: 'final',
    dedupeKey: `workspace-agent:${requestId}`,
  });
  await interviewStore.appendEvent(session.id, 'workspace.voice_response', { requestId, command: 'attempt', text });
  return text;
}
