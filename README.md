# 🏢 Office Hackathon

> Build a better booking tool — 3 hours, anything goes

**Teams of 4 · 3 hours · review & awards the following week**

---

## Contents

- [The challenge](#the-challenge)
- [Setup guide](#setup-guide)
- [Choosing models 
- & thinking](#choosing-models--thinking)
- [Security — where to run Claude](#security--where-to-run-claude)
- [On the day checklist](#on-the-day-checklist)
- [Troubleshooting](#troubleshooting)

---

## The challenge

### The problem

Our current office booking tool gets the basics right. But "functional" shouldn't be the ceiling for something we use every day.

Your job isn't to clone it. It's to ask: what should an office booking experience actually feel like in 2026? Then build the beginning of that.

> *Start with a frustration, not a feature list.*

### Your mission

Build a POC that solves a real problem someone in this office has — something you'd actually want to use. It should work for real people, not just look good in a demo.

It doesn't have to be finished. It has to be convincing.

---

### Insight seeds — problems worth solving

Use these to find your angle, or ignore them if your team has a better idea.

**People don't book, they just show up**
Booking tools assume intentional behaviour. Most people decide where to sit based on who's already there, noise, proximity to their team — none of which any tool captures.

**No-shows are invisible**
Rooms get booked and never used. Desks reserved and sat empty all day. The system thinks the office is full; the office is actually half-empty.

**The tool doesn't know your team**
"Book me a desk" could mean anything. Near my team? Quiet zone? Standing desk? Booking tools treat everyone the same.

**Nobody knows what "busy" actually means**
Is Tuesday busy? Are meeting rooms hoarded by one team? The data exists but nobody's looking at it.

**Planning the office is guesswork**
How many desks do we actually need? What will next month look like? Anyone managing the office is doing it on gut feel and spreadsheets.

---

### Team recipes — pick one, adapt freely

These are suggestions, not rules. Figure out what suits your team and your idea.

**Recipe A — Driver + navigator**
One person drives Claude and shares their screen. Everyone else navigates — suggesting prompts, challenging outputs, steering direction. Rotate the driver if energy drops.
*Good for: teams who want to build one coherent thing together.*

**Recipe B — Prototype + critic**
Two people build in Claude, two people stress-test what comes out — questioning assumptions, thinking about real users, asking "would someone actually use this?". Great for QAs.
*Good for: teams who want to build something robust, not just impressive-looking.*

**Recipe C — Diverge + converge**
Spend the first 30 minutes with each person exploring a different angle separately. Come back together, pick the best bits, and build that for the rest of the session.
*Good for: teams who aren't sure what to build yet and want to explore fast.*

**Recipe D — Build + narrate**
Two people build the thing, one person builds the story — what problem does this solve, who's the user, what's the wow moment? The narrator shapes the demo as you go.
*Good for: teams who want to walk out with something demo-ready.*

---

### Prompt guide

Don't start by asking Claude to build something. Start by asking it to help you think.

**1. Find your problem**
```
We're a team of developers and QAs building a POC to improve on Kadence,
our office booking tool. We have 3 hours. Give us 5 specific, solvable
problems that a better booking tool could solve — and for each one, tell
us what success would look like in a 5-minute demo.
```

**2. Design your data**
```
We're building [your idea]. What data would we need to make this feel real
and useful? Design a realistic dataset — describe the shape of it, what
fields matter and why, and any interesting patterns to bake in. Then
generate it.
```

**3. Build fast**
```
Build me a [dashboard / chat interface / booking UI / visualisation] that
shows [specific thing]. Use [React / plain HTML / Python]. Make it feel
like a real product. Use realistic data.
```

**4. Make it smarter**
```
This is working but it's basically just displaying data. How could we use
AI to make it actually intelligent — to surface something a user couldn't
find themselves, or make a decision the user shouldn't have to make?
```

**5. Prepare the demo**
```
We've built [describe what you made]. Help us structure a 5-minute demo.
What's the opening hook? What's the moment that makes people lean forward?
What do we not show?
```

---

### Loose plan for the evening

One hard rule: stop building 30 minutes before the end. Everything else is flexible.

| When | What |
|------|------|
| **First 20 min** | Find your problem, pick your recipe, agree what you're building. Use Claude to decide — don't spend 20 minutes debating without it. |
| **Middle stretch** | Build. Around halfway, all teams do a 2-minute show & tell. What are you making? What's surprised you? Steal ideas freely. |
| **Last 30 min** | Stop building. Shape your 5-minute demo. What's the story? What's the moment that lands? |

---

### Badges — pick 3 to run for

Instead of competing against each other, each team picks 3 badges at the start and runs for those. Declare them before you start building — you're on your honour.

| Badge                        | To earn it |
|------------------------------|-----------|
| 🚀 **The Shipper**           | Judges must be able to imagine it running in production. Bonus if someone says "can we have this Monday?" |
| ✨ **Pixel Perfect**          | At least two people must say "oh that looks great" during the demo. Unprompted. |
| 🛡️ **The QA Seal**          | Describe at least one thing Claude got wrong that you caught and fixed. |
| 🚪 **Door Test**             | Hand your laptop to another team at the demo. If they can use it without instructions, badge awarded. |
| 🎸 **Vibe Coder**            | Must have pivoted at least once, said "let's just try it" at least twice, and still shipped something. |
| 🔄 **The Pivot**             | Explain what you started building and why you binned it. Points for dramatic retelling. |
| ⏱️ **Last Minute Legend**    | It came together in the final 20 minutes. Teammate testimony required. |
| 🌍 Carbon Negative           | Built something that could genuinely reduce Mercator's environmental impact. Extra credit if you can quantify it.|
| 🪄 **Prompt Whisperer**      | Share the prompt during the demo. The room must audibly react. "Huh" counts. "Wait what" is better. |
| 🧠 **Genuinely Intelligent** | The AI must be doing something a filter or dropdown couldn't do. Judges may challenge you. |
| 👻 **Best Hallucination**    | Show the original unhinged Claude output. Keeping it in the final product earns extra respect. |
| 🪙 **Token Miser**           | Built something genuinely impressive on the smallest token budget. Bring your usage numbers to the demo — frugality is a flex. |
| 🔮 **Bold Swing**            | Genuinely ambitious concept, partial completion fully accepted. Must end the demo with "imagine if we had another week." |

---

### Review & awards

Demos happen the week after. Five minutes per team. Badges awarded on the day.

---

## Setup guide

> Complete this the evening before or morning of the hackathon. Takes around 15 minutes.

### Step 1 — Fork and clone the repo

Everything you need lives in this repo. Forking it means we can see your team's progress and you have your own copy to work in.

1. Click **Fork** in the top-right corner of this repo, then **Create fork** — this creates a copy under your own GitHub account.
2. Clone your fork locally:
```bash
   git clone https://github.com/YOUR-USERNAME/internal-hackathon-desk-booking-app.git
   cd internal-hackathon-desk-booking-app
```
3. Work inside this folder throughout the hackathon. Commit and push your work at the end so it's visible in your fork.

### Step 2 — Check your Node.js version

Claude Code requires Node.js 18 or higher.

```bash
node --version
```

If you see `v18.x` or above, you're good. If not, update Node before continuing.

### Step 3 — Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Verify the install:

```bash
claude --version
```

You should see a version number. If you get `command not found`, check that your npm global bin directory is on your PATH — run `npm bin -g` to find it.

### Step 4 — Authenticate with your API key

**You don't need a Claude account for this hackathon.** We'll hand each person an API key on the day (or just before) — no Mercator team membership or individual sign-up required.

Set your key as an environment variable:

```bash
export ANTHROPIC_API_KEY=your_key_here
```

To make it persist across terminal sessions, add that line to your `~/.zshrc` or `~/.bashrc`, then reload:

```bash
source ~/.zshrc   # or ~/.bashrc
```

Then start Claude Code — it picks up the key automatically:

```bash
claude
```

> 💷 **Each key has a fixed budget behind it.** It's plenty for the evening, but it's not infinite — if you burn through it on a runaway loop you'll need to ask for a top-up. See [Choosing models & thinking](#choosing-models--thinking) for how to spend it wisely (and check out the 🪙 Token Miser badge).

### Step 5 — Smoke test

Inside your cloned repo, run:

```bash
claude
```

Type `"Create a hello world HTML file"` and check that Claude responds and creates the file. If it works, you're set — delete the test file afterwards.

---

## Choosing models & thinking

You've got a budget, so spend it where it counts. A quick guide to picking the right tool for the job.

### Which model?

| Model | Reach for it when... |
|-------|---------------------|
| **Haiku** | Quick, cheap, well-defined tasks — boilerplate, simple edits, formatting, quick questions. Fastest and lightest on your budget. |
| **Sonnet** | Your default workhorse. The right balance of speed, cost and capability for almost all hackathon building. Start here. |
| **Opus** | The hard stuff — gnarly architecture decisions, debugging something subtle, reasoning across a lot of context. Most capable, most expensive. Use deliberately, not by default. |

**Rule of thumb:** build on Sonnet, drop to Haiku for the trivial stuff, and escalate to Opus only when Sonnet is visibly struggling. You can switch models inside Claude Code with the `/model` command.

### When to use extended thinking

Extended thinking lets Claude reason through a problem before answering. It costs more tokens but produces much better results on hard problems.

**Worth it for:** architecture and design decisions, debugging something confusing, planning a multi-step build, anything where a wrong answer costs you 20 minutes.

**Skip it for:** simple edits, formatting, quick lookups, generating boilerplate — thinking here just burns budget for no gain.

You can nudge Claude into deeper reasoning by saying "think carefully about this" or "think step by step" in your prompt.

---

## Security — where to run Claude

Claude Code can read, create, and modify files in the directory you start it from, and run commands. A few sensible rules so nothing goes wrong:

- **Only run `claude` inside your hackathon project folder.** Don't start it in your home directory, your Documents, or the root of another work project — it should only ever see the files for this exercise.
- **Don't point it at anything sensitive.** No company secrets, customer data, credentials, or production code in the working directory. This is a sandbox for a fictional booking tool — keep it that way.
- **Keep your API key private.** Don't paste it into chats, commit it to git, or share it. It has real money behind it. If you think it's leaked, tell an organiser and we'll rotate it.
- **Review before you run.** When Claude proposes a shell command, read it before approving — especially anything that deletes files or installs packages.
- **The repo is the boundary.** Everything you build should live inside your forked repo. If Claude wants to wander outside it, that's your cue to pause.

> Treat the API key like a company credit card and the working directory like a clean desk: keep both contained to the task.

---

## On the day checklist

- [ ] Hackathon repo forked to your GitHub account
- [ ] Repo cloned locally and you're working inside it
- [ ] API key set: `echo $ANTHROPIC_API_KEY` returns your key
- [ ] `claude --version` returns a version number
- [ ] `claude` opens a session without errors
- [ ] You know how to switch models with `/model`

---

## Troubleshooting

**`claude: command not found`**
Your npm global bin isn't on your PATH. Run `npm bin -g`, copy the path, and add it to your shell profile (`~/.zshrc` or `~/.bashrc`).

**`Invalid API key` or auth errors**
Check `echo $ANTHROPIC_API_KEY` actually prints your key. If it's empty, your `export` line didn't load — re-run it or `source` your shell profile. If the key is set but still rejected, it may need a top-up or rotating — grab an organiser.

**Permission denied on install**
Try `sudo npm install -g @anthropic-ai/claude-code`.

**Burning through budget fast**
Switch to a lighter model with `/model`, turn off extended thinking for simple tasks, and avoid pasting huge files repeatedly. See [Choosing models & thinking](#choosing-models--thinking).

**Anything else**
Come a few minutes early on the day — we'll sort it together before we kick off.