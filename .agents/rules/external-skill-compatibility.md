# External Skill Compatibility

External skills are general engineering guidance.

Before applying recommendations from external React, TypeScript or UI skills:

1. Inspect the project's package.json and existing architecture.
2. Respect the versions actually installed in this repository.
3. Do not introduce APIs requiring newer React, TypeScript, Refine,
   Ant Design, Vite or other dependency versions.
4. Do not upgrade dependencies unless explicitly requested.
5. Existing project-specific architecture rules take precedence over
   generic external skill recommendations.
6. Do not introduce new architecture layers, libraries or folders only
   because an external skill recommends them.
7. Refine and Ant Design conventions already used by this project should
   be preserved unless explicitly requested otherwise.
8. Project-specific skills and rules have higher priority than these
   imported generic skills.
