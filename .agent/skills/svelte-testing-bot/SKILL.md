---
name: svelte-testing-bot
description: Generates Unit, Integration, and E2E tests for SvelteKit using Vitest and Playwright.
---

# Skill: Svelte Testing Bot

## Purpose
To ensure code reliability by automating the creation of test suites for critical paths (Auth, CRUD, Forms).

## Instructions
1. **Unit Testing:** Create `.test.ts` files alongside components for Vitest. Focus on logic and props.
2. **E2E Testing:** Create files in `/tests` for Playwright. Focus on user flows (e.g., "User can sign in").
3. **Mocking:** Mock Supabase responses using `vi.mock` to test UI states without making real network calls.
4. **Coverage:** Aim for testing edge cases like form validation errors and API timeouts.



## Example
**User Input:** "Add a test to ensure the login button is disabled while submitting."
**Agent Action:** Generate a Playwright test that fills the input, clicks submit, and asserts the `disabled` attribute.