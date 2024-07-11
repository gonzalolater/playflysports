/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "360px",
        "desk-dialog": "640px",
        sm: "640px",
        md: "768px",
        "mini-desktop": "950px",
        desktop: "1024px",
        d: "1024px", /* Alias for desktop  */
        nd: {max: "1024px"}, /* max-width desktop  */
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px"
      },
      colors: {
        sheet: "#141316",
        blue: {
          low: "#178C8A",
          high: "#5CE5E2"
        },
        yellow: "#FFEA7F",
        orange: "#E5A65C",
        pink: "#FF6685",
        "dim-white": "#D9D9D9",
        "dim-black": "#323232",
        outline: {
          2: "#3D3D3D"
        },
        grey: {
          subtle: "#888",
          grain: "#C0C0C0",
          classic: "#888888",
          low: "#2C2C2C",
          high: "#4C4C4C",
          type: "#9E9E9E"
        }
      },
      borderRadius: {
        card: "0.625rem",
        half: "0.3125rem",
        "2.5xl": "1.25rem"
      },
      fontSize: {
        fine: "0.9375rem",
        title: "1.4375rem",
        idxtitle: "1.5625rem"
      },
      spacing: {
        5.5: "1.375rem",
        7.5: "1.875rem",
        12.5: "3.125rem",
        14.5: "3.75rem",
        25: "6.25rem"
      }
    }
  },
  plugins: []
};
