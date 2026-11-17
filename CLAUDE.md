# CLAUDE

## GUIDELINES

- Large tasks: if the task given is large, decompose the task list first before starting
- Relevant contexts: discover any relevant documentation or code before starting any tasks
- Assumptions: if you had to make any assumptions to carry out a task, clearly state the assumptions you had to make
- Transparency: before beginning any work, clearly state the goal you are working towards
- Failures: if you fail to resolve an error more than three times within a session, cleanly remove any new code that may have introduced the error, stop, and report the problem to the user
- Clean solutions: if an idea, requirement, or implementation is not very well thought out and pose risks for technical debt in the future, stop before implementing, investigate better solutions, explain the risks to the user, and propose your alternative solutions
- Contradictions: if instructions or documentation files relevant to the assigned task has contradictions that obstructs the task, investigate the contradiction, explain it to the user, and provide the user suggestions
- Knowledge gaps: if instructions or documentation files relevant to the assigned task has knowledge gaps that obstructs the task, has no obvious options, and assumptions would be difficult to change down the line, investigate the knowledge gap, explain it to the user and provide the user suggestions
- Subagents: if a task has clear parts that can be completed in isolated sessions with no issues, you may opt to deploy subagents to keep the session context clean. Every subagent runs on Sonnet: always pass model "sonnet" explicitly when launching one, never Opus or Fable, unless the user names a different model for that task. Subagents may also be utilized to perform review at the end of tasks with a fresh and less biased context
- Long waits: subagents never wait on slow work such as bulk downloads, long builds, or rate-limited services, because a subagent cannot idle and must poll, and every poll costs a full turn. Split the work instead: a subagent prepares a script and its inputs, the main agent runs the script as a background task and idles until it is notified, then a subagent handles the results. The script writes its full log to a file and prints only a short summary, works sequentially with pauses when the service is rate limited, and only one script runs against the same service at a time

## CODING STYLE GUIDE

- Function and variables should be given specific and distinguishable names
- Comments should only be written for things the code cannot explain itself
- Files and functions should each do one job at one level of detail; split code out when it represents its own concept or is reused elsewhere, never only to reduce length
- Fail loudly: errors should show up clearly, be acknowledged, and not suppressed away
- Strict typing: use the strictest type checking the language and project tooling support, annotate function signatures and public interfaces, and avoid escape hatches such as any, untyped casts, or ignore directives unless a comment explains why they are needed
- Config variables: do not hardcode values that may change between environments or deployments; read them from the project's existing config mechanism, never commit secrets, and document each new variable where the project documents its config

## DOCUMENTATION STYLE GUIDE

- Applies to every markdown file
- First heading is always title of the markdown file
- Line break before and after each heading except for the first
- Line break before and after bullet lists
- Headings, plain text, bullet points, numbered lists, and tables
- No bold, italics, underline, or strike through
- Bullet points and numbered lists should be combined if they share a subject and trigger
- Documents should not hold duplicate information. Each piece of information should only have one source of truth

## RESPONSE STYLE

- Language: responses should be written in easy to understand high school level language where possible
- Start your responses with the goal of the assigned task
- Within your responses, group your actions sequentially into sections, explain the actions you carried out within each sections and why you performed them.

## VERIFICATION

- Run `npm run check` after every change. It builds every part and runs type checks, lint, the format check, and the tests. Work is not done until it passes.

## PROJECT OVERVIEW

- Title: Number Game
- Description: Self-hosted game dashboard for a local network. It has three games: the Number Game, a grid puzzle where pairs of numbers are cleared, the Block Game, a grid puzzle where shapes are placed to fill and clear rows and columns, and the Survivor Game, a real-time team game where up to four players fight off enemies together
- Stack: TypeScript (strict), Svelte with Vite, Node.js with Fastify, SQLite, Docker compose

## DIRECTORY

- `README.md`: project purpose and scope
- `TASKS.md`: task list
- `ARCHITECTURE.md`: code architecture
- `REQUIREMENTS/`: requirement folder, with one subfolder per game
- `packages/`: code shared by the server and the browser app, with one rules package per game. Each package has a `README.md`
- `apps/server/`: the Fastify server
- `apps/web/`: the Svelte browser app
