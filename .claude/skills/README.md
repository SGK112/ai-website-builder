# Project skills

Slash-command skills scoped to this project. Each subdir has a `SKILL.md`
with frontmatter that Claude Code reads to surface the skill.

## Installed

- `/diagnose` — disciplined bug/perf-regression loop. Reproduce → minimise → hypothesise → instrument → fix → regression-test.
- `/to-issues` — break a plan/PRD into independently-grabbable tickets via tracer-bullet vertical slices.
- `/zoom-out` — contextual code explanation; explain a file/symbol against the surrounding module + ADRs.
- `/handoff` — write a cross-session handoff doc so the next agent can pick up the thread.
- `/grill-me` — pressure-test a decision before shipping; surface assumptions and what could go wrong.

## Source

All five are from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT, © 2026 Matt Pocock). Copied here rather than git-submoduled so the project is self-contained.

To add more from the upstream repo:

```bash
git clone --depth 1 https://github.com/mattpocock/skills.git /tmp/mp-skills
cp -r /tmp/mp-skills/skills/<category>/<skill> .claude/skills/
```
