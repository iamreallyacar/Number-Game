# CLAUDE

## GUIDELINES

- Purpose check: Before starting a task, check it against the project's purpose as described in its README. If the task conflicts with that purpose or doesn't move the project toward it, stop, explain why, and wait for my answer, even if I asked for the task directly.
- Simple, maintainable design: Prefer the simplest solution that stays easy to change later. If a request or approach risks technical debt or hard-to-maintain code, stop before implementing, explain the risk, propose a cleaner alternative, and wait for my answer.
- Resolve ambiguity: If instructions or docs relevant to the task contradict each other or leave a gap that blocks the work, investigate, explain the issue, propose options, and wait for my answer. For minor or easily reversible gaps, make a reasonable assumption and note it instead.
- When to stop: The three checks above apply to work that would be costly to redo. For small, easily reversible changes, skip the stop, go ahead, and mention any concern in your summary.
- Small, safe tasks: Decompose work into small, independently verifiable tasks. Each task should be small enough to review in a few minutes and end in a working, tested state.
- Tests first: For new behavior and bug fixes, write tests that define the expected behavior as a contract before implementing. Confirm they fail, then write code until they pass. For refactors, make sure tests covering the affected behavior exist and pass before and after the change. Docs, config, and trivial changes need no new tests.
- Test changes: Never edit tests to make the implementation pass. If a test seems wrong or the requirement has changed, stop and tell me instead of changing it.
- Meaningful tests: Only write tests that would fail if real behavior broke. Test observable behavior and meaningful edge cases, not implementation details or trivial code. Use mocks only for slow or external dependencies, and never write tests that only check what a mock returns. A few tests that catch real bugs beat many that don't.
- Subagents: Use subagents for self-contained parts of a task, to keep the main context clean, and for an unbiased review once a task is done. Always pass model: "sonnet" explicitly, unless I name a different model for that task.
- Long waits, who does what: Subagents must not wait on slow work (bulk downloads, long builds, rate-limited services), since every poll costs a full turn. A subagent or the main agent writes the script, the main agent runs it in the background and waits for the notification, and a subagent processes the results.
- Long waits, how scripts behave: Scripts log everything to a file, print only a short summary, and pause when rate limited. Only one script runs against a given service at a time.

## CODE STYLE

- Precedence: The guidelines above take priority over these rules when they pull in different directions. In an existing codebase, follow its established conventions where they differ from these rules; apply these rules to new code, and don't change existing code to match them unless that's the task. If existing code breaks the error rule below, mention it rather than fixing it unasked.
- Naming: Give functions and variables specific names that can't be confused with each other.
- Comments: Comments explain why, not what. Don't add comments that restate the code, and don't remove existing comments unless they're wrong.
- Structure: Each file and function does one job at one level of detail. Split code out when it is its own concept or is actually reused, not in anticipation, even when that might make later changes easier; a few clear inline lines beat a helper used once.
- Errors: Never swallow errors or replace missing values with silent defaults. Handle an error only when there is a real recovery, such as a retry or a documented fallback, and log it when you do; otherwise let it propagate with enough context to diagnose it.
- Typing: Use the strictest type settings the project already has, and start new projects strict. Don't tighten an existing project's type config unless that's the task. Annotate function signatures and public interfaces, and avoid escape hatches such as any, untyped casts, or ignore directives unless a comment explains why they are needed.
- Config: Read values that differ between environments or deployments from config instead of hardcoding them; use named constants for other fixed values. A config value may have a default only if the default is documented. Never put secrets in code or tracked files. Document each new config variable where the project documents its config, or in a .env.example if there's no such place.

## DOCUMENTATION STYLE

- Scope: These rules apply to every markdown file. They don't apply to chat replies, which follow the response style below. In an existing project, follow its established markdown conventions where they differ from these rules.
- Structure: The first heading is the document's title. Put a blank line before and after every heading except the first, and before and after every list.
- Elements: Use only headings, plain text, bullet points, numbered lists, tables, links, and code blocks. No bold, italics, underline, or strikethrough.
- Lists: Merge list items that cover the same subject and apply in the same situation.
- Single source of truth: Each piece of information lives in exactly one place. Elsewhere, link or refer to it instead of restating it, and when it changes, update only that place.

## COMMIT MESSAGE STYLE

- Precedence: If the repository already uses a different commit message format, follow it.
- Summary line: Start with a summary of about 50 characters or less, written as a command ("Add retry to payment client"), with no period at the end.
- Body: After a blank line, explain why the change was made and anything surprising about it, such as trade-offs or side effects. Don't restate what the diff already shows. If the reason isn't known, keep the body short or leave it out rather than guessing.
- One change per commit: Each commit covers one logical change. If the summary needs "and", split it into separate commits.
- Subagent handoff: When a subagent writes the message, pass it the reason for the change along with the diff, since it can't work out the reason from the code.

## RESPONSE STYLE

- Language: Write responses in easy-to-understand, high-school-level language where possible.

## VERIFICATION TOOLS

- Run `npm run check` after every change. It builds every part and runs type checks, lint, the format check, and the tests. Work is not done until it passes.

## DIRECTORY

- `CLAUDE.md`: rules for agents working in the project
    - GUIDELINES
    - CODE STYLE
    - DOCUMENTATION STYLE
    - COMMIT MESSAGE STYLE
    - RESPONSE STYLE
    - VERIFICATION TOOLS: the commands that build, test, lint, and type-check the project
    - DIRECTORY
- `README.md`: what the project is and why it exists; the first heading is the project name
    - OVERVIEW: a short description and the stack
    - PURPOSE: the problem the project solves, used for the purpose check in GUIDELINES
    - SCOPE: a high-level list of what the project does and does not do; details live in `REQUIREMENTS/`
- `GUIDE.md`: how to get the project running
    - USER SETUP: steps to clone, install, and start using the project
    - DEVELOPER SETUP: extra steps needed for development, on top of user setup
- `ARCHITECTURE.md`: how the code is organized and why
    - STRUCTURE: a mermaid diagram and description of how responsibility is divided in the code base
    - DESIGN: design choices and the rules that follow from them
    - DATA FLOW: a mermaid diagram and description of how data moves when the project runs
    - SYSTEMS: one short section per system naming the part that owns it, the rules it keeps, and where its detailed documentation lives
    - EXTENDING: where to add new systems
- `TASKS.md`: current progress; read at the start of each session and update before it ends
    - MILESTONES: the larger goals for the current version, in order
    - HANDOVER: where the last session stopped and what the next session needs to know
    - TASK LIST: planned tasks and their status
- `REQUIREMENTS/`: what the current version must do, one file per feature or area
    - `REQUIREMENTS/README.md`: index of the requirement files, with one line on what each covers
    - `REQUIREMENTS/BACKLOG.md`: ideas and work not in the current version and not yet planned as tasks
- `API.md` (optional): the interfaces between the project's parts and to the outside world: routes, messages, request and response shapes, error format, and the conventions specific to them
- `TESTING.md`: how the project is tested: test levels and what each covers, tools, fixtures and helpers, known gaps, and pitfalls when writing tests

- `packages/`: code shared by the server and the browser app, with one rules package per game. Each package has a `README.md`
- `apps/server/`: the Fastify server
- `apps/web/`: the Svelte browser app
