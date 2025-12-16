# Azurite

<div align="center">
  <h3>A beautiful, local-first markdown memo application.</h3>
  <p>Built with Next.js, Electron, and Shadcn UI.</p>
</div>

## ✨ Features

- **Local First**: All data is stored locally on your machine. No internet required.
- **Markdown Support**: Rich text editing with full Markdown support.
- **Organization**: Nested categories/channels and tag management to keep your notes organized.
- **Media Friendly**:
  - Drag & drop file attachments
  - Auto-expanding YouTube, Twitter (X), and Open Graph link previews
- **Modern UI**:
  - Clean, distraction-free interface
  - Light / Dark / Extra Dark themes
  - Smooth animations powered by Framer Motion & Tailwind Animate
- **Fast Search**: Instantly find memos by content, tags, or category.

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Desktop Runtime**: Electron
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI (Radix UI)
- **Icons**: Lucide React
- **Data Storage**: Local JSON File System

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm / yarn / pnpm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/CubeZeero/Azurite.git
   cd Azurite
   ```

2. Install dependencies
   ```bash
   npm install
   ```

### Development

**Run in Web Mode (Browser):**
```bash
npm run dev
```

**Run in Desktop Mode (Electron):**
```bash
npm run electron:dev
```

### Build

Create a production build for your OS:
```bash
npm run electron:build
```

The output application will be in the `dist` directory.

## 📂 Project Structure

- `src/app`: Main application routes and layout
- `src/components`: React UI components
- `src/lib`: Utility functions and services
  - `services/`: Core logic for file system operations (User, Category, Memo)
- `electron`: Electron main process configuration

## 📄 License

MIT
