# antigravity_tooling
Tooling for Improve Development Process using Antigravity

## Antigravity Configuration

This repository contains the configuration for the Antigravity agent, designed to enhance the development workflow. The configuration consists of persona definitions, rules, specialized skills, and automated workflows.

### Core Configuration

- **[GEMINI.md](GEMINI.md)**: Defines the **Agent Persona & Behavior**. It establishes the role (Senior Principal Engineer), planning requirements, operating style, and tone. It also outlines critical safety protocols and general coding standards.
- **[.agent/CONTEXT.md](.agent/CONTEXT.md)**: Provides specific project conventions, such as the use of `uv` for package management, `aiohttp` for web services, and the requirement for virtual environments (`.venv`).

### Rules

Located in `.agent/rules/`, these files define conditional or context-specific rules for the agent.

- **async-programming-expert.md**: Guidelines for writing efficient asynchronous code.
- **code-reviewer.md**: Instructions for performing code reviews.
- **cython-development.md**: Rules for working with Cython.
- **patching-files.md**: Guidelines for applying patches.
- **prompt-expert.md**: Strategies for crafting effective prompts.
- **python-development.md**: Comprehensive standards for Python development (testing, linting, typing).
- **rust-development.md**: Standards for Rust integration.

### Skills

Located in `.agent/skills/`, subdirectories contain specialized instructions (`SKILL.md`) for complex tasks.

- **aws-serverless**: Building serverless apps on AWS.
- **code-review**: Conducting code reviews.
- **cython-extensions**: Building and fixing Cython extensions.
- **database-schema-validator**: Validating SQL schemas.
- **docstring**: Generating Google-style docstrings.
- **git-commit-formatter**: Formatting conventional commit messages.
- **json-to-pydantic**: Converting JSON to Pydantic models.
- **license-header-adder**: Adding license headers to files.
- **parrot-scaffold-tool**: Scaffolding AI Parrot tools.
- **production-dockerfile**: Creating production-ready Dockerfiles.
- **python-standards**: Applying Python tooling standards (uv, ruff, etc.).
- **reverse-engineering-api**: Reverse engineering web APIs using HAR files.
- **rust-pyo3-function**: Implementing Rust functions for Python via PyO3.
- **skill-creator**: Guide for creating new skills.
- **svelte5-structural**: Structuring Svelte 5 applications.

### Workflows

Located in `.agent/workflows/`, these `.md` files define multi-step automated procedures.

- **create-parrot-tool**: Steps to create a new Parrot Tool.
- **create-workflow**: Instructions for creating a new Antigravity Workflow.
- **debug-regressions-with-git-bisect-binary-search**: Workflow for finding regressions using git bisect.
- **generate-tests**: Generating pytest suites.
- **git-new-feature**: Creating a new feature branch.
- **parrot-mcp-server**: Scaffolding a SimpleMCPServer.
- **release_package**: Steps for releasing a package.
- **start-flow**: A fresh startup workflow.

## How to Use

To use this Antigravity configuration in your project:

1. **Copy Configuration**: Copy the `.agent` directory and `GEMINI.md` file to the root of your repository.
2. **Customize Context**: Edit `.agent/CONTEXT.md` to match your specific project's detailed conventions and architecture.
3. **Review Skills & Rules**: Check `.agent/skills` and `.agent/rules`. Remove any that are not relevant to your project (e.g., if you don't use Rust, you can remove `rust-development.md` and related skills).
