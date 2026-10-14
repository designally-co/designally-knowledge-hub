# Decision notes for the Designally Brain

Before you finish a build session, write a note for each decision the session made, in `decisions/`, and commit it with the work. Do this without being asked; there is no approval step. Format and rules: `decisions/README.md`.

- A decision is a choice someone could later ask "why is it like this?" about: a library or service, the data shape, hosting and deploys, a rule users meet, an approach tried and dropped. Small fixes need no note.
- Read `decisions/` first. If a note already covers it, update that note.
- Never guess. Take facts only from sources: a link pinned to a commit, a file in this repo, or what the person said in the session ("Buk, 2026-10-07"). If the reason is not clear, ask the person once; if it is still unknown, leave `## Why` empty.
- Write `author: ai`. No secrets, passwords, client contact details or personal data.

# Keep `brain.yaml` true

`brain.yaml` at the repo root is how the Designally Brain knows what this app is and does. The Brain reads it from `main` every night, and nothing else updates it: the loader never edits it. So when a change makes anything in it untrue, update it in the same change, without being asked.

- Check it whenever a change touches what a person can do, what the app is for, its address, its stack, its tables or its links to other apps. Examples: a feature added, removed or hidden; a language turned off; a new table; a move to another database.
- Edit only what the change made untrue. Keep the rest exactly as it is, and leave `generated` alone (the person who merges the change checks the file).
- Format: `https://github.com/designally-co/designally-brain/blob/main/docs/brain-yaml.md`. Same rules as the notes: no guessing (unknown stays empty), no secrets, no personal data.
- Name the update in the pull request, so the reviewer checks it.
- Facts that live outside the code (a Portainer or Vercel setting, a release that went live) cannot be seen by the Brain. When the session learns one that matters later, write it in a decision note or in the right doc listed under `docs:` in `brain.yaml`.
