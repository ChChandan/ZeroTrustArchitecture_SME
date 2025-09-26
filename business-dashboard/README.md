# BusinessPro Dashboard

A professional, production-ready React dashboard for small and medium businesses, featuring modern UI, responsive design, and Keycloak authentication integration points. Perfect for investor demos and real-world business use.

![BusinessPro Dashboard Screenshot](https://dummyimage.com/1200x600/2563eb/ffffff&text=BusinessPro+Dashboard+Preview)

---

## Features

- **React 18** with functional components and hooks
- **Tailwind CSS** for modern, responsive UI
- **Lucide React icons** for a clean look
- **Keycloak authentication** integration points (mocked for demo, easily swapped for production)
- Professional sidebar navigation, header, stat cards, and tables
- Mobile-first responsive layout
- Subtle shadows, gradients, and smooth transitions
- Clean, accessible code and semantic HTML

---

## Project Structure

```
business-dashboard/
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── index.html
├── src/
│   ├── index.js
│   ├── App.js
│   ├── index.css
│   └── components/
│       └── Dashboard.js
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm (v8+ recommended)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/business-dashboard.git
   cd business-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

   The app runs on [http://localhost:3000](http://localhost:3000).

---

## Keycloak Integration

This template is ready for Keycloak integration:

- The authentication logic in `src/App.js` uses mock functions for login/logout.
- When ready to integrate:
  - Replace the mock `handleLogin` with a Keycloak login redirect (e.g., using [keycloak-js](https://www.npmjs.com/package/keycloak-js)).
  - Replace `handleLogout` with a Keycloak session termination.
  - Add token handling and user info logic in place of the mock user state.
- See comments in the code for clear integration points.

---

## Customization

- **Branding:** Edit colors and logo in `tailwind.config.js` and sidebar/header components.
- **Chart Integration:** Replace the chart placeholder in `Dashboard.js` with your preferred library (e.g., Chart.js, Recharts).
- **Data:** Replace mock data with real API calls as needed.

---

## Build & Deployment

To create a production build:

```bash
npm run build
```

Deploy the contents of the `build/` directory to any static hosting provider (Vercel, Netlify, GitHub Pages, etc.).

---

## License

© {year} BusinessPro. All rights reserved.

---

## Credits

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Keycloak](https://www.keycloak.org/)

---