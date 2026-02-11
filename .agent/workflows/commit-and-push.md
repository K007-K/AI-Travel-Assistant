---
description: Commit and push changes to git after completing a fix or feature
---

After completing any code change (fix, feature, refactor, etc.), follow these steps:

// turbo-all

1. Check for uncommitted changes:
```bash
cd /Users/appalarajukuramdasu/Desktop/AITRAVEL && git status
```

2. Stage all changes:
```bash
cd /Users/appalarajukuramdasu/Desktop/AITRAVEL && git add -A
```

3. Commit with a descriptive message following conventional commits format (`feat:`, `fix:`, `refactor:`, `chore:`, etc.):
```bash
cd /Users/appalarajukuramdasu/Desktop/AITRAVEL && git commit -m "<type>: <short description>"
```

4. Push to the remote `main` branch:
```bash
cd /Users/appalarajukuramdasu/Desktop/AITRAVEL && git push origin main
```
