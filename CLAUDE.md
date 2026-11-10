# CLAUDE

## GUIDELINES

- Large tasks: if the task given is large, decompose the task list first before starting.
- Assumptions: if you had to make any assumptions to carry out a task, clearly state the assumptions you had to make.
- Failures: if you run into errors more than three times within a session, cleanly remove the problematic code, and report the failure to the user.
- Clean solutions: if an idea, requirement, or implementation is not very well thought out and pose risks for technical debt in the future, stop before implementing, explain the risks to the user, and propose a cleaner alternative
- Transparency: before beginning any work, clearly state the goal you are working towards
- Relevant contexts: discover any relevant documentation or code before starting any tasks
- Knowledge gaps: if instruction or documentation files relevant to the task has contradictions or knowledge gaps that obstructs the task, mark the problematic instructions or statements within the files

## CODING STYLE GUIDE

- Function and variables should be given specific and distinguishable names
- Comments should be written for things the code cannot explain itself
- Files and functions should each do one job at one level of detail; split code out when it represents its own concept or is reused elsewhere, never only to reduce length
- Fail loudly: errors should show up clearly, be acknowledged, and not suppressed away.
- Existing code should be cleaned up if you stumble upon them and they very clearly violate the above rules
- Strict typing: use the strictest type checking the language and project tooling support, annotate function signatures and public interfaces, and avoid escape hatches such as any, untyped casts, or ignore directives unless a comment explains why they are needed
- Config variables: do not hardcode values that may change between environments or deployments; read them from the project's existing config mechanism, never commit secrets, and document each new variable where the project documents its config

## DOCUMENTATION STYLE GUIDE

- Applies to every markdown file
- First heading is always title of the markdown file
- Line break before and after each heading except for the first
- Line break before and after bullet lists
- Headings, plain text, bullet points, and tables
- No bold, italics, underline, or strike through
- Bullet points should be combined if they share a subject and trigger

## RESPONSE STYLE

- Language: responses should be written in easy to understand high school level language where possible
- Start your responses with the goal of the assigned task
- Within your responses, include what actions you made and why in terms of the project as a whole

## VERIFICATION

- Run `npm run check` after every change. It builds every part and runs type checks, lint, the format check, and the tests. Work is not done until it passes.

## PROJECT OVERVIEW

- Title: Number Game
- Description: Self-hosted game dashboard for a local network, starting with the Number Game, a grid puzzle where pairs of numbers are cleared
- Stack: TypeScript (strict), Svelte with Vite, Node.js with Fastify, SQLite, Docker compose

## DIRECTORY

- `README.md`: project purpose and scope
- `TASKS.md`: task list
- `ARCHITECTURE.md`: code architecture
- `REQUIREMENTS/`: requirement folder
