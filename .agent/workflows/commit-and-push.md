---
description: Commit and push changes to git after completing a fix or feature. IMPORTANT - This workflow MUST be run automatically after EVERY code change without waiting for the user to ask. Always commit and push when a task is confirmed working.
---

After completing any code change (fix, feature, refactor, etc.), follow these steps AUTOMATICALLY without user prompting:

// turbo-all

1. Stage all changes:
```bash
cd /Users/appalarajukuramdasu/Desktop/AITRAVEL && git add -A
```

2. Commit with a descriptive message following conventional commits format (`feat:`, `fix:`, `refactor:`, `chore:`, etc.):
```bash
cd /Users/appalarajukuramdasu/Desktop/AITRAVEL && git commit -m "<type>: <short description>"
```

3. Push to the remote `main` branch:
```bash
cd /Users/appalarajukuramdasu/Desktop/AITRAVEL && git push origin main
```
