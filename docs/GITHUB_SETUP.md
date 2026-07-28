# Create the private GitHub repo

Run these on **your machine** (VS Code terminal, in the project folder). Git
works cleanly on Windows; it can't be initialised reliably from the assistant's
sandbox, so a couple of setup steps are done here by you.

## 0. Remove the leftover `.git` folder (one time)

The assistant created a partial `.git` folder it couldn't clean up. Delete it
first so you start fresh:

PowerShell:
```powershell
Remove-Item -Recurse -Force .git
```
or Command Prompt:
```cmd
rmdir /s /q .git
```

## 1. Confirm secrets are ignored (already set up)

`.gitignore` already excludes `.env`, `node_modules`, and `dist`. Double-check
nothing sensitive is about to be committed:
```bash
git init
git add -A
git status            # .env must NOT appear in the list
```
If `.env` ever shows up, stop and fix `.gitignore` before committing.

## 2. First commit

```bash
git config user.name "Chibesa Mumbi"
git config user.email "chibesamumbi21@gmail.com"
git commit -m "MTV platform: minimal reskin, circuit background, guardrailed chatbot, security hardening"
git branch -M main
```

## 3. Create the PRIVATE repo and push

Easiest with the GitHub CLI (`gh`) — it makes the repo private in one line:
```bash
gh auth login
gh repo create mtv-platform --private --source=. --remote=origin --push
```

No `gh`? Create the repo manually:
1. Go to https://github.com/new
2. Name: `mtv-platform`. Set visibility to **Private**. Do **not** add a README/
   .gitignore (you already have them). Create.
3. Then:
```bash
git remote add origin https://github.com/<your-username>/mtv-platform.git
git push -u origin main
```

## 4. Wire it to Vercel (optional, recommended)

Import the private repo at https://vercel.com/new, add the environment variables
from `docs/SECURITY.md`, and every `git push` to `main` auto-deploys.

## Safety reminders

- Keep the repo **private**. It contains your app logic (not secrets, but still).
- Never commit `.env`. If a secret is ever committed by accident, rotate that key
  immediately — deleting the commit is not enough once it's been pushed.
