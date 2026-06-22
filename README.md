# 🇧🇩 Bonton (বন্টন) - Expense Sharing & Settlement System

**Bonton** (বন্টন - Bengali for distribution/division) is an elegant, local-first web application designed for splitting shared costs and optimizing group settlements. Built using Next.js 16 (App Router), TypeScript, Tailwind CSS, and Framer Motion, it runs entirely in the browser, storing all group and expense data locally for maximum privacy and performance.

---

## ✨ Features

- **Local-First Architecture**: Your data never leaves your browser. All calculation and persistence are handled locally via client-side storage.
- **Dynamic Animations**: An interactive, premium user interface styled with custom CSS gradients, glassmorphism components, and beautiful path animations (including a custom-animated SVG path logo).
- **Smart Debt Simplification**: Built-in settlement optimizer using path-reduction algorithms to reduce the total number of transactions required to clear debts.
- **Flexible Splitting Models**:
  - Split equally among members
  - Split by custom percentages
  - Split by fixed amounts
  - Pre-subtract personal initial bills before splitting
- **Bilingual Interface**: Seamless translation support between English (EN) and Bengali (বাংলা).
- **Advanced Export Utilities**:
  - Download group balance sheets as high-quality PDFs
  - Generate and copy Markdown statements
  - Save visual settlement receipts as images

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS & Vanilla CSS Variables
- **Animations**: Framer Motion (`motion/react`)
- **State Management**: Zustand (with state hydration persistence)
- **Testing**: Vitest + React Testing Library
- **Package Manager**: Bun

---

## 📁 Project Structure

The project conforms to the **src-first** architecture specified in our development guidelines:

```
BontonWeb/
├── src/
│   ├── app/                    # Next.js page views & global routing
│   │   ├── groups/             # Group creation, details, export, and settlement pages
│   │   ├── globals.css         # Styling directives and custom color systems
│   │   ├── layout.tsx          # Root Layout (wraps providers & common shell)
│   │   └── page.tsx            # Main dashboard view redirect
│   ├── components/
│   │   ├── ui/                 # Reusable primitive visual design tokens (shadcn-based)
│   │   │   ├── animated-logo.tsx
│   │   │   ├── border-beam.tsx
│   │   │   └── ...
│   │   └── common/             # Global layout containers (AppShell, Providers)
│   ├── features/
│   │   └── splitly/components/ # Feature-specific components for balance sheet splitting
│   ├── shared/
│   │   ├── lib/                # Shared utilities (currency, formatters, i18n, exports)
│   │   └── types/              # Unified TypeScript definitions (types/index.ts)
│   ├── store/                  # Zustand stores (splitly-store.ts)
│   └── __tests__/              # Vitest specification suites
├── public/                     # Static assets (fonts, logo SVG)
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

Ensure you have [Bun](https://bun.sh/) installed on your machine.

### 1. Install Dependencies
```bash
bun install
```

### 2. Run the Development Server
```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the app.

### 3. Verify Codebase
To run linting checks:
```bash
bun run lint
```

To run test suites:
```bash
bun run test
```

To build for production:
```bash
bun run build
```

---

## 📄 License
This project is private and proprietary.
