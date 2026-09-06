'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Settings, Video, CheckCircle2 } from 'lucide-react';
import styles from './InteractiveInterviewMock.module.css';

export interface RoleMockData {
  name: string;
  code: string;
  color: string;
  subtitle: string;
  messages: Array<{
    sender: 'agent' | 'user';
    time: string;
    text: string;
  }>;
}

const ROLES_DATA: RoleMockData[] = [
  {
    name: 'Hiring Manager',
    code: 'HM',
    color: '#3ecf8e',
    subtitle: 'Background, ownership & leadership',
    messages: [
      {
        sender: 'agent',
        time: '8:44 PM',
        text: "Hi! Welcome to your RoundTable panel interview. To start, tell me about a project you've worked on recently and where you took primary technical ownership.",
      },
      {
        sender: 'user',
        time: '8:45 PM',
        text: 'I architected the real-time collaboration layer for a multi-user workspace, handling live presence and sub-50ms document sync.',
      },
      {
        sender: 'agent',
        time: '8:45 PM',
        text: 'Strong foundation. When deadlines were tight between infrastructure reliability and feature requests from stakeholders, how did you balance priorities?',
      },
      {
        sender: 'user',
        time: '8:46 PM',
        text: 'We established strict latency and crash-rate SLOs: any degradation above 50ms immediately halted new feature rollouts until resolved.',
      },
    ],
  },
  {
    name: 'Technical Interviewer',
    code: 'TC',
    color: '#06b6d4',
    subtitle: 'Architecture, algorithms & code evaluation',
    messages: [
      {
        sender: 'agent',
        time: '8:46 PM',
        text: 'Technical interviewer here. Walk me through the data structures and network protocol you chose for that real-time sync layer.',
      },
      {
        sender: 'user',
        time: '8:47 PM',
        text: 'We implemented state-based Conflict-Free Replicated Data Types (CRDTs) over WebSockets with server reconciliation via Redis streams.',
      },
      {
        sender: 'agent',
        time: '8:47 PM',
        text: 'How did you handle vector clock growth and garbage collection of tombstones during long-lived multi-client editing sessions?',
      },
      {
        sender: 'user',
        time: '8:48 PM',
        text: 'We introduced snapshot checkpoints at sequence boundaries, pruning tombstones once all connected clients acknowledged the watermark.',
      },
    ],
  },
  {
    name: 'Product Manager',
    code: 'PM',
    color: '#a855f7',
    subtitle: 'Product sense, roadmap & user impact',
    messages: [
      {
        sender: 'agent',
        time: '8:48 PM',
        text: 'Product perspective here. How did you validate that users actually experienced less friction rather than just adding technical complexity?',
      },
      {
        sender: 'user',
        time: '8:49 PM',
        text: 'We monitored workflow telemetry and interviewed 15 beta teams, observing collaborative task completion increase by 38%.',
      },
      {
        sender: 'agent',
        time: '8:49 PM',
        text: 'If engineering constraints forced you to cut half the planned launch scope, what did you prioritize and why?',
      },
      {
        sender: 'user',
        time: '8:50 PM',
        text: 'I prioritized instant keystroke sync and reliable conflict resolution over rich media embedding to guarantee core workflow reliability.',
      },
    ],
  },
  {
    name: 'Customer Advocate',
    code: 'CS',
    color: '#f59e0b',
    subtitle: 'Client empathy & incident communication',
    messages: [
      {
        sender: 'agent',
        time: '8:50 PM',
        text: 'Customer advocate here. Imagine an enterprise client reports a sync hiccup during an executive presentation. How do you respond?',
      },
      {
        sender: 'user',
        time: '8:51 PM',
        text: 'I communicate transparently: acknowledge the issue, reassure them that local edits are queued safely, and provide plain-language status updates.',
      },
      {
        sender: 'agent',
        time: '8:51 PM',
        text: 'How do you ensure enterprise client feedback directly shapes sprint planning instead of getting buried in support tickets?',
      },
      {
        sender: 'user',
        time: '8:52 PM',
        text: 'We tag support escalations with automated issue trackers and hold bi-weekly triage syncs between Customer Success leads and engineering pod owners.',
      },
    ],
  },
  {
    name: 'Behavioural Evaluator',
    code: 'BH',
    color: '#ec4899',
    subtitle: 'Collaboration, feedback & culture',
    messages: [
      {
        sender: 'agent',
        time: '8:52 PM',
        text: 'Behavioural evaluator here. Tell me about a time when a team member strongly disagreed with your proposed architecture.',
      },
      {
        sender: 'user',
        time: '8:53 PM',
        text: 'A senior peer preferred monolithic SQL scripts while I proposed an automated schema migration pipeline. We built prototypes of each to evaluate objectively.',
      },
      {
        sender: 'agent',
        time: '8:53 PM',
        text: 'How did you navigate that tension to reach alignment without damaging the working relationship?',
      },
      {
        sender: 'user',
        time: '8:54 PM',
        text: 'I co-authored the migration runbook with them, giving them direct ownership over the rollout observability dashboard so we succeeded as a cohesive team.',
      },
    ],
  },
];

interface InteractiveInterviewMockProps {
  selectedRoleIndex?: number;
  onRoleSelect?: (index: number) => void;
  onActivityChange?: (active: boolean) => void;
}

export function InteractiveInterviewMock({
  selectedRoleIndex = 0,
  onRoleSelect,
  onActivityChange,
}: InteractiveInterviewMockProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showCameraCheck, setShowCameraCheck] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(532); // 8:52

  // Live countdown timer ticking down naturally
  useEffect(() => {
    if (isEnded) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isEnded]);

  const activeRole = ROLES_DATA[selectedRoleIndex] ?? ROLES_DATA[0];

  const toggleMic = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      onActivityChange?.(!next);
      return next;
    });
  }, [onActivityChange]);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
    setShowCameraCheck(false);
  }, []);

  const toggleCameraCheck = useCallback(() => {
    setShowCameraCheck((prev) => !prev);
    setShowSettings(false);
  }, []);

  const handleEndConversation = useCallback(() => {
    setIsEnded((prev) => !prev);
  }, []);

  // Quick cycle on clicking the role pill
  const handleNextRole = useCallback(() => {
    const nextIdx = (selectedRoleIndex + 1) % ROLES_DATA.length;
    onRoleSelect?.(nextIdx);
  }, [selectedRoleIndex, onRoleSelect]);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s} remaining`;
  };

  return (
    <div className={styles.card} data-internal-scroll="true">
      {/* Top Header Bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.brandBadge}>RT</div>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle}>RoundTable AI</span>
            <span className={styles.brandSub}>LIVE INTERVIEW ROOM</span>
          </div>

          {/* Clean Role Pill Badge (updated when clicking 3D artifact, mini badges, or pill) */}
          <button
            type="button"
            className={styles.rolePill}
            onClick={handleNextRole}
            title="Click to advance to next role, or click any role in the 3D constellation"
            aria-label={`Current role: ${activeRole.name}. Click to switch.`}
          >
            <span className={styles.rolePillDot} style={{ background: activeRole.color }} />
            <span>Introduction / {activeRole.name}</span>
          </button>
        </div>

        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.cameraBtn}
            onClick={toggleCameraCheck}
            aria-label="Toggle camera check preview"
            title="Optional camera check"
          >
            <Video size={12} />
            <span>Optional camera check</span>
          </button>

          <span className={styles.timerBadge}>
            {isEnded ? 'Paused' : formatTimer(secondsRemaining)}
          </span>

          <button
            type="button"
            className={styles.endBtn}
            onClick={handleEndConversation}
            aria-label={isEnded ? 'Resume conversation' : 'End conversation'}
          >
            <span className={styles.endDot} />
            <span>{isEnded ? 'Resume' : 'End Conversation'}</span>
          </button>
        </div>
      </header>

      {/* Two Column Layout */}
      <div className={styles.room}>
        {/* Left Column: Live Transcript */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.transcriptTitleRow}>
              <span className={styles.transcriptHeading}>Conversation</span>
              <span className={styles.livePill}>
                <span className={styles.liveDot} />
                LIVE
              </span>
            </div>
            <span className={styles.transcriptSub}>Live transcript</span>
          </div>

          <div className={styles.chatList}>
            {activeRole.messages.map((msg, index) => {
              const isAgent = msg.sender === 'agent';
              return (
                <div
                  key={index}
                  className={isAgent ? styles.agentMsg : styles.userMsg}
                >
                  <span
                    className={`${styles.msgMeta} ${
                      isAgent ? styles.agentMeta : ''
                    }`}
                  >
                    {isAgent ? `Agent (${activeRole.name})` : 'You'} {msg.time}
                  </span>
                  <div
                    className={isAgent ? styles.agentBubble : styles.userBubble}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Column: Stage & Perspective Controls */}
        <div className={styles.stage}>
          {/* Top Panel Perspective Card */}
          <div className={styles.perspectiveCard}>
            <div className={styles.perspectiveTop}>
              <div className={styles.perspectiveLeft}>
                <div
                  className={styles.avatarBox}
                  style={{ background: activeRole.color }}
                >
                  <span>{activeRole.code}</span>
                  <span className={styles.avatarDot} />
                </div>
                <div className={styles.perspectiveTitles}>
                  <span className={styles.perspectiveEyebrow}>
                    CURRENT PANEL PERSPECTIVE
                  </span>
                  <span className={styles.perspectiveRole}>
                    {activeRole.name}
                  </span>
                  <span className={styles.perspectiveSub}>
                    {activeRole.subtitle}
                  </span>
                </div>
              </div>

              <div className={styles.perspectiveRightBlock}>
                {/* 5-Role quick selectors inside card */}
                <div className={styles.miniRoleList} aria-label="Select role perspective">
                  {ROLES_DATA.map((r, i) => (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => onRoleSelect?.(i)}
                      className={`${styles.miniRoleBtn} ${
                        selectedRoleIndex === i ? styles.miniRoleBtnActive : ''
                      }`}
                      style={{
                        borderColor: selectedRoleIndex === i ? r.color : undefined,
                        color: selectedRoleIndex === i ? r.color : undefined,
                        background: selectedRoleIndex === i ? `${r.color}24` : undefined,
                      }}
                      title={`Select ${r.name}`}
                    >
                      {r.code}
                    </button>
                  ))}
                </div>

                <div
                  className={`${styles.statusChip} ${
                    !isMuted ? styles.statusChipActive : ''
                  }`}
                >
                  <span className={styles.statusChipDot} />
                  <span>{!isMuted ? 'Speaking' : 'Ready'}</span>
                </div>
              </div>
            </div>

            <div className={styles.perspectiveStyleRow}>
              <span>Interview style</span>
              <span className={styles.perspectiveStyleVal}>Professional · Adaptive Evaluation</span>
            </div>
          </div>

          {/* Animated Dual Glowing Orb in Center */}
          <div className={styles.orbSection}>
            <div
              className={`${styles.orbWrapper} ${
                !isMuted ? styles.orbActive : ''
              }`}
            >
              <div className={styles.orbAmbientGlow} />
              <div className={styles.orbCore} />
            </div>
            <span className={styles.orbStateLabel}>
              {isEnded ? 'Paused' : !isMuted ? 'Talking' : 'Ambient'}
            </span>
          </div>

          {/* Voice Pipeline Performance Chips */}
          <div className={styles.pipelineRow}>
            <span className={styles.pipelineLabel}>VOICE PIPELINE</span>
            <span className={styles.pipelineChip}>Deepgram STT</span>
            <span className={styles.pipelineChip}>
              OpenAI LLM <span className={styles.pipelineMetric}>ttfs 2317ms</span>
            </span>
            <span className={styles.pipelineChip}>
              MiniMax TTS <span className={styles.pipelineMetric}>ttfb 410ms</span>
            </span>
          </div>

          {/* Bottom Audio & Mic Controls */}
          <div className={styles.controlsRow}>
            <button
              type="button"
              onClick={toggleMic}
              className={`${styles.micToggleBtn} ${
                isMuted ? styles.micToggleMuted : styles.micToggleActive
              }`}
              title={isMuted ? 'Click to unmute microphone' : 'Click to mute microphone'}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff size={19} /> : <Mic size={19} />}
            </button>

            <button
              type="button"
              onClick={toggleSettings}
              className={styles.gearBtn}
              title="Voice & Audio Settings"
              aria-label="Voice settings"
            >
              <Settings size={15} />
            </button>
          </div>

          {/* Simulated Floating Settings Popover */}
          {showSettings && (
            <div className={styles.settingsPopover}>
              <div className={styles.popoverRow}>
                <span>Input Device</span>
                <span className={styles.popoverVal}>Default Mic (HD)</span>
              </div>
              <div className={styles.popoverRow}>
                <span>Echo Cancellation</span>
                <span className={styles.popoverVal}>Agora 3A</span>
              </div>
              <div className={styles.popoverRow}>
                <span>Noise Suppression</span>
                <span className={styles.popoverVal}>Active</span>
              </div>
            </div>
          )}

          {/* Simulated Camera Check Popover */}
          {showCameraCheck && (
            <div className={styles.settingsPopover}>
              <div className={styles.popoverRow}>
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 size={13} /> Camera Check OK
                </span>
                <span className={styles.popoverVal}>1080p · 30fps</span>
              </div>
              <p className="text-[0.6rem] text-[#888] m-0">
                Consent recorded. No raw video is stored or analyzed.
              </p>
            </div>
          )}

          {/* Footer Branding */}
          <div className={styles.footerPowered}>
            <span>AI INTERVIEW PANEL · POWERED BY</span>
            <span className={styles.agoraLogoText}>agora</span>
          </div>
        </div>
      </div>
    </div>
  );
}
