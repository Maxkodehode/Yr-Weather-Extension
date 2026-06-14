# Workflow: Website / Web UI Development

## Phase 1: Understand
1. Read `context/project.md` — clarify goals and requirements
2. Read `context/constraints.md` — know the boundaries
3. Check `planning/` for existing plans
4. Ask clarifying questions if anything is ambiguous

## Phase 2: Plan
1. Break the project into discrete components/pages
2. Create a plan in `planning/YYYY-MM-DD-plan.md`
3. Identify dependencies between components
4. Get user approval on approach before coding

## Phase 3: Build
1. Set up project structure (HTML, CSS, JS files)
2. Build mobile-first — start with base styles, add breakpoints
3. Use semantic HTML elements
4. Test in browser tools as you build (screenshot verification)
5. Commit after each logical unit of work

## Phase 4: Verify
1. Test responsive behavior (mobile, tablet, desktop widths)
2. Check accessibility (semantic HTML, alt text, keyboard nav)
3. Validate HTML/CSS if tools available
4. Screenshot key pages and save to `output/`
5. Document any known issues in `work-log/`

## Phase 5: Deliver
1. Ensure all files are in the workspace
2. Update `work-log/YYYY-MM-DD.md` with summary
3. If deployment is in scope, follow deployment steps
4. Tell the user what was built and where to find it

## Verification Checklist
- [ ] Pages render without errors
- [ ] Responsive at 320px, 768px, 1024px, 1440px
- [ ] No console errors in browser
- [ ] All images have alt text
- [ ] All forms have labels
- [ ] Color contrast is readable
