/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        background: "#F8FAFC",
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F1F5F9",
          subtle: "#F8FAFC",
        },
        // Text
        foreground: "#0F172A",
        secondary: {
          DEFAULT: "#F1F5F9",
          foreground: "#475569",
        },
        muted: {
          DEFAULT: "#F8FAFC",
          foreground: "#64748B",
        },
        disabled: "#94A3B8",
        
        // Borders
        border: {
          DEFAULT: "#E2E8F0",
          hover: "#CBD5E1",
          active: "#93C5FD",
        },
        
        // Brand Blue
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          active: "#1E40AF",
          bright: "#3B82F6",
          light: "#DBEAFE",
          subtle: "#EFF6FF",
          foreground: "#FFFFFF",
        },

        // Technical Cyan Accent
        cyan: {
          DEFAULT: "#06B6D4",
          light: "#CFFAFE",
        },

        // Intelligence Violet Accent
        violet: {
          DEFAULT: "#7C3AED",
          light: "#EDE9FE",
        },

        // Feedback
        success: {
          DEFAULT: "#16A34A",
          light: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#D97706",
          light: "#FEF3C7",
        },
        error: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
        },

        // Terminal
        terminal: {
          bg: "#0F172A",
          text: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(15, 23, 42, 0.05)',
        'card-hover': '0 8px 30px rgba(15, 23, 42, 0.08)',
        dropdown: '0 10px 38px -10px rgba(15, 23, 42, 0.12), 0 10px 20px -15px rgba(15, 23, 42, 0.07)',
      },
    },
  },
  plugins: [],
}
