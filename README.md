# Merit

A job-search assistant for designers that runs on your own computer.

Merit is one of five free tools for designers from [ambiegarden.com](https://ambiegarden.com).

You tell Merit what a good job looks like for you. Then you paste in each posting you find — its text, a link or a screenshot — and Merit checks it against your criteria: every criterion gets a pass, a miss or "not mentioned", with the reason. A posting that clearly misses a required criterion goes to Not sure (never deleted). The decision stays yours.

- **Local.** Your criteria and postings are plain files in one folder on your computer (`~/Merit/data`). No account, no tracking.
- **You choose the AI, if any.** Claude Code (with a paid Claude plan), Ollama (free, fully local), or none — without AI you check postings yourself.

## What you need

- **Node.js 20.19 or newer** (22 recommended) — [nodejs.org](https://nodejs.org)
- **Optional:** an AI engine, to check postings for you. See [Choosing an AI engine](#choosing-an-ai-engine).

## Choosing an AI engine

Merit works without AI: you read and mark each posting yourself. An AI can read each one for you and say how well it matches what you're looking for, and why.

| | Claude Code | Ollama | No AI |
|---|---|---|---|
| **Cost** | A paid Claude plan | Free | Free |
| ***What it does for you*** | | | |
| **Matches each posting against what you're looking for** | Yes, most precise | Yes, less precise | No, you do that |
| **Reads a posting from a screenshot** | Yes | Yes | No |
| **Drafts cover letters** | Yes | Yes | No |
| **Suggests what to work on, from all your postings** | Yes | Yes | No |
| **Counts the skills and tools postings ask for** | Yes | Yes | Yes |
| ***What it takes*** | | | |
| **Where your postings, experience and skills are read** | Sent to Anthropic, Claude's maker | On this computer | Nowhere: no AI reads them |
| **Limits** | Your Claude plan's usage limits | Your computer's speed: an older one can be very slow | All by hand: you read and mark every posting, and get no suggestions |

**Claude Code:** install it from [claude.com/claude-code](https://claude.com/claude-code) and sign in with your Claude account, on a paid plan. The free Claude plan doesn't include it.

**Ollama:**
1. Install it from [ollama.com](https://ollama.com) and start it.
2. In Merit, open **Settings → AI engine** and click **Ollama AI** under Ollama to download it (about 3.4 GB). Merit has Ollama download gemma3, Google's model, which also reads screenshots. Using it means accepting Google's [Gemma Terms of Use](https://ai.google.dev/gemma/terms). You can stop the download, continue it later, or delete what it left, from the same place.

Then, in Merit, open **Settings → AI engine**: what it finds on your computer can be chosen there. Installed one after starting Merit? Reload the page.

## Start it

Download this repository (Code → Download ZIP, then unzip it — or `git clone` it), then double-click the start file in its folder:

- **Windows:** `Start Merit.bat`
- **Mac:** `Start Merit.command`. The first time, macOS blocks it, as it comes from the internet: right-click it → Open, or on newer macOS open **System Settings → Privacy & Security** and click **Open Anyway** next to its name
- **Linux:** run `./start-merit.sh` in a terminal

The first time it installs what Merit needs (a minute or two); every time it starts Merit and opens **http://localhost:3000** in your browser. Close the window to stop Merit. Merit only listens on your own computer: nothing on your network can reach it.

From a terminal instead:

```
npm install
npm start
```

Then open **http://localhost:3000**, and stop it with `Ctrl+C`.

Using Claude Code? Open it in Merit's folder and ask it to "start Merit" — it can run the steps above for you.

## First steps

The first time you open Merit, a short setup walks you through it:

1. **Criteria** — what matters to you: each criterion is *Doesn't matter*, *Nice to have* or *Required*.
2. **Skills and tools** — what you bring, so each posting shows which of them it asks for.
3. **AI engine** — the one found on your computer, or none (you can change it later in Settings).

Then **Add postings**: paste a posting's text, a link or a screenshot. With an AI engine it is checked straight away; without one, you mark each criterion on the posting's page.

## Your data

Everything is in `~/Merit/data` (on Windows, `C:\Users\<you>\Merit\data`):

| File | What it holds |
|---|---|
| `criteria.json` | Your criteria and their levels |
| `profile.json` | About you: your experience, skills and tools |
| `settings.json` | The AI engine you chose |
| `postings/<id>.json` | One posting each: its text, link, marks and reasons |
| `postings/<id>.png` (or `.jpg` …) | A posting's screenshot |

Copy the folder and you have a backup. To keep the data elsewhere, start Merit with `MERIT_DATA_DIR` set to another folder.

## Settings you can change

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `3000` | The port on localhost |
| `MERIT_DATA_DIR` | `~/Merit/data` | Where your data is kept |

## For developers

SvelteKit + Svelte 5, run locally with `@sveltejs/adapter-node` through `start.js`. Strings are in `messages/en.json` (Paraglide).

```
npm run dev     # development server
npm run check   # type check (svelte-check)
npm run build   # production build (npm start builds, then serves it)
```

The look comes from `src/app.css`, generated by a design-system configurator: its tokens are the one place colours, sizes and spacing are set. Anything only Merit needs is in `src/project.css`.

## License

Free to use, change and share for any noncommercial purpose, such as your own job search; not to sell or use commercially. The terms are the [PolyForm Noncommercial License 1.0.0](LICENSE). Copyright (c) 2026 Irina Sima, [ambiegarden.com](https://ambiegarden.com).
