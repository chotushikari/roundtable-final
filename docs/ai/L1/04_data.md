# Data and State

Draft definitions are editable. Publishing creates immutable `interview_versions`, and invitations/sessions point to a version. Candidates provide the report display name before a guest invitation is claimed when the company did not prefill it. Candidate turns have a session-scoped dedupe key; analyses are unique per substantive candidate turn. Session state records introduction, background, panel, and wrap-up phases and increments `state_version` on controller/tool/interruption changes. Conversational pause/repeat/navigation turns are retained without scoring or advancing phase and are excluded from final evidence. Artifacts use optimistic versions and append `artifact_versions` via a database trigger.

For a Job-scoped definition, plan generation reads the current `job_competencies` server-side. A complete hiring bar (at least three competencies) becomes the plan's normalized competency rubric, and the resulting plan is then copied into the immutable interview version at publication. Editing the Job later does not mutate an already published rubric.

Resume files are private, delimited as untrusted claims, and may only seed verification questions. They are never assessment evidence. Completed code/canvas tasks reference the immutable `artifact_versions` row used by the final assessment; skipped workspace tasks create no artifact evidence. Schedule `purge_expired_interview_data()` daily to enforce 30-day deletion.

Migration `202609060001_linear_mcp.sql` is retained as immutable database history. Its optional columns are no longer populated by the company dashboard or candidate voice controller.

Migration `202609050001_coverage_demo.sql` adds `interview_definitions.demo_mode`; publishing copies `demoMode` into immutable version JSON. An absent flag means normal mode, apart from legacy two-minute behavior. Demo progress derives from the initial Hiring Manager answer and prior analysis decisions, excluding the latest still-unanswered question. No additional scoring state is accepted from the browser.
