# ⚖️ JUDGEJUDGE — Judge Gemma: MTG Rules Arbiter

> Ah, tcg... A fun way to socialize and to have fun with your friends; it would be a shame if your lifelong friendships would be destroyed because you disagree on a ruling question. What if you are not here to make friends and you are a COMPETITIVE slugger who wants to destroy the competition? Maybe even you are a judge who needs a little help with some of the complex ruling... 
>
> **WELL WAIT NO MORE MY SWEET SUMMER CHILD!!!!**
>
> JUDGEJUDGE is an app where you can ask any tcg question to the judge gemma and he is going to give you the exact ruling and he WILL be the final answer to all rulings. **ONE JUDGE TO RULE THEM ALL** No longer will you need to fight over a ruling question, no more questions, JUDGE KNOWS ALL... Tired of your hooman judge ASK JUDGE GEMMA!!!! He will be the only judge you will ever need...

---

## 🌟 Key Features

### 1. Dual-Engine Judge (Online AI + 100% Offline Engine)
- **Online:** Powered by `@google/genai` (Gemini 3.8 / Gemma rules agent), providing instantaneous, step-by-step rulings grounded in the official rules.
- **Offline:** Fully autonomous client-side **Mechanical Reasoning Engine**. Evaluates card Oracle text, continuous layers (CR 613), the stack (CR 405), priority (CR 117), APNAP triggers (CR 101.4), replacement effects (CR 614/616), and state-based actions (CR 704)—without any internet connection!

### 2. Decluttered Answers & Hoverable Rule Sources
- **Hero Verdict Card:** Get the direct ruling in seconds with prominent, clear typography.
- **Interactive Rule Badges:** Every citation (e.g., `CR 613.1d`, `CR 704.5s`, `CR 101.4c`, `CR 614.12`) is an interactive badge. **Hover over any rule citation** to see a floating popover displaying the exact official rule title, category, and wording.
- **Collapsible Resolution Steps:** Detailed chronological resolution steps are broken into clean numbered cards.
- **Tournament Table Guidance:** Compact practical advice for communicating the ruling clearly during timed rounds.

### 3. Continuous Effects Layer Sandbox (CR 613)
- Real-time simulation of all 7 continuous effect layers:
  - **Layer 1:** Copy & Mutate effects
  - **Layer 2:** Control-changing effects
  - **Layer 3:** Text-changing effects
  - **Layer 4:** Type-changing effects (Blood Moon, Dryad of the Ilysian Grove, Urza's Saga)
  - **Layer 5:** Color-changing effects (Painter's Servant)
  - **Layer 6:** Ability-adding/removing effects (Humility, Dress Down)
  - **Layer 7:** Power/Toughness sublayers (7a CDA, 7b Base P/T, 7c Modifications, 7d Counters, 7e Switching)
- Supports timestamp reordering and dependency checks.

### 4. Interactive Stack & Priority Simulator (CR 405 & CR 117)
- Visualizes LIFO (Last In, First Out) stack resolution.
- Pass priority between Active Player (AP) and Non-Active Player (NAP).
- Resolves simultaneous triggers in APNAP order (CR 101.4c) and shows automatic State-Based Action (SBA) checks.

### 5. MTGJSON & Comprehensive Rulebook Offline Storage
- **MTGJSON Importer:** Upload `AllPrintings.json`, `AtomicCards.json`, or set files. Automatically parses and indexes 30,000+ cards into browser **IndexedDB** for offline querying.
- **Rulebook Importer:** Import official Comprehensive Rules files to index every rule clause (`100.1` through `905.7`).
- **Card Oracle:** Search any card offline or live via Scryfall API with full Oracle text and Gatherer rulings.

### 6. Progressive Web App (PWA)
- Installable on Desktop, Android, and iOS Safari.
- Offline Service Worker caches all assets and Scryfall images so the app runs smoothly in tournament halls without signal.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `v20.0.0` or `v22.x LTS` (Required for modern GenAI and Tailwind v4 native bindings)
- **npm:** `v9.0.0+`

### Installation

1. **Clone or navigate to the repository:**
   ```bash
   cd judge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key to `.env`:
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```
   *(Note: The app works 100% offline with the local mechanical rules engine even without an API key!)*

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open your browser to [http://localhost:3000](http://localhost:3000).

---

## 📦 Scripts

- `npm run dev` — Starts the full-stack dev server on port `3000` with hot middleware.
- `npm run build` — Compiles the Vite frontend for production.
- `npm run start` — Runs the production server via `tsx server.ts`.
- `npm run lint` — Validates TypeScript types across the codebase.

---

## ⚖️ License
Apache-2.0
