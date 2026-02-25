---
description: Commit and push changes to git after completing a fix or feature. IMPORTANT - This workflow MUST be run automatically after EVERY code change without waiting for the user to ask. Always commit and push when a task is confirmed working.
---

After completing any code change (fix, feature, refactor, etc.), follow these
steps AUTOMATICALLY without user prompting:

// turbo-all

1. **Update README if needed** — If the change adds a new feature, module, API
   integration, or architectural change, update `README.md` to reflect it. Key
   sections to check:
   - 🌟 Key Features (new capabilities)
   - 🏗️ Core Modules (new engine modules/APIs)
   - 🗂 Project Structure (new files/directories)
   - 🧪 Testing (test count, new test scenarios)

2. Stage all changes:

```bash
cd /Users/appalarajukuramdasu/Desktop/AITRAVEL && git add -A
```

3. Commit with a descriptive message following conventional commits format
   (`feat:`, `fix:`, `refactor:`, `chore:`, etc.):

```bash
cd /Users/appalarajukuramdasu/Desktop/AITRAVEL && git commit -m "<type>: <short description>"
```

4. Push to the remote `main` branch:

```bash
cd /Users/appalarajukuramdasu/Desktop/AITRAVEL && git push origin main
```
