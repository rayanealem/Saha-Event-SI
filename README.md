# Saha-Event-Saha 🎉

A modern, full-stack event management platform built with Next.js 15, Supabase, and a clean component-driven UI.

---

## ✨ Features

- **Authentication** — Secure session-based auth powered by Supabase SSR
- **Event Management** — Create, browse, and manage events with rich date-picking and filtering
- **Responsive UI** — Fully responsive interface built with Tailwind CSS and Radix UI primitives via shadcn/ui
- **Animated Interactions** — Smooth transitions and micro-interactions using Framer Motion
- **Form Validation** — Runtime schema validation with Zod
- **Password Security** — Passwords hashed with bcryptjs

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Database & Auth | [Supabase](https://supabase.com/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Date Handling | [date-fns](https://date-fns.org/) + [React Day Picker](https://react-day-picker.js.org/) |
| Validation | [Zod](https://zod.dev/) |
| Icons | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- A [Supabase](https://supabase.com/) project

### 1. Clone the Repository

    git clone https://github.com/your-username/saha-event-saha.git
    cd saha-event-saha

### 2. Install Dependencies

    npm install

### 3. Configure Environment Variables

    cp .env.local.example .env.local

Then edit `.env.local`:

    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

> Find these in your Supabase project under **Settings → API**.

### 4. Run the Development Server

    npm run dev

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

    saha-event-saha/
    ├── app/                  # Next.js App Router pages & layouts
    ├── components/           # Reusable UI components
    │   └── ui/               # shadcn/ui base components
    ├── lib/                  # Utility functions (cn, helpers)
    ├── utils/
    │   └── supabase/         # Supabase client & middleware helpers
    ├── middleware.ts          # Auth session middleware
    ├── next.config.mjs        # Next.js configuration
    └── tailwind.config.ts     # Tailwind CSS configuration

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the app for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## 🔐 Authentication

Authentication is handled by **Supabase Auth** with server-side session management via the `@supabase/ssr` package. The `middleware.ts` file automatically refreshes sessions and protects routes across the application.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">Built with ❤️ using Next.js & Supabase</p>
