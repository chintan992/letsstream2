AGENTS.md is a simple, open format for guiding coding agents, used by over 20k open-source projects. It serves as a README for agents, providing context and instructions to help AI coding agents work on a project.

Key aspects of AGENTS.md:

- **Purpose:** To provide a dedicated, predictable place for AI coding agents to find instructions, complementing `README.md` files which are primarily for humans.
- **Content:** It can include setup commands, code style guidelines, testing instructions, PR instructions, and other project-specific information that might clutter a `README.md`.
- **Flexibility:** It's standard Markdown, allowing any headings. Agents parse the text provided.
- **Nested Files:** For large monorepos, nested `AGENTS.md` files can be used for subprojects, with the closest file to the edited file taking precedence.
- **Compatibility:** It's compatible with a growing ecosystem of AI coding agents and tools, including Semgrep, Ona, GitHub Copilot, Google's Jules and Gemini CLI, Kilo Code Factory, Phoenix, UiPath's Coded Agents, Aider, Zed, OpenAI's Codex, RooCode, Cursor, Warp, opencode, Amp, VS Code, and Cognition's Devin.
- **Usage:** To use it, create an `AGENTS.md` file at the root of the repository and add relevant sections.
- **Automatic Testing:** If testing commands are listed, agents will attempt to execute relevant programmatic checks and fix failures.
