---
name: a11y-guardian-react
description: Audits and implements WCAG/ARIA standards in React components, focusing on Radix UI primitives and semantic JSX.
---

# Skill: Accessibility (a11y) Guardian for React

## Purpose
To ensure that React components—especially those built with shadcn/ui—remain fully accessible, screen-reader friendly, and keyboard-navigable by leveraging Radix UI primitives and React best practices.

## Instructions
1. **Semantic JSX:** Use semantic HTML tags over generic `<div>`. If a component acts as a button, it MUST be a `<button>` or a Radix primitive with the correct role.
2. **Radix UI "asChild" Pattern:** When nesting components in shadcn/ui, always use the `asChild` prop to avoid redundant DOM nodes and maintain proper event bubbling/focus management.
3. **Focus Management:** - Use `useRef` and `useEffect` to manage focus manually only when Radix primitives (like Dialog or Popover) don't handle it automatically.
   - Ensure `focus-visible` rings are never disabled via Tailwind (`outline-none`) without a high-contrast alternative.
4. **ARIA Attributes in React:**
   - Use `aria-label` for icon-only buttons.
   - Use `aria-describedby` to link inputs with help text or error messages.
   - Ensure `htmlFor` is used on `<label>` to link with input `id`.
5. **Fragment Usage:** Use `<React.Fragment>` (or `<>`) to avoid adding unnecessary wrapping `div` elements that break CSS Grid/Flexbox or accessibility trees.

## Examples

**User Input:** "Create a delete button with just a trash icon."
**Agent Action:**
```tsx
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

// Correct implementation with screen reader support
export const DeleteButton = () => (
  <Button variant="destructive" size="icon" aria-label="Delete item">
    <Trash className="h-4 w-4" />
  </Button>
);