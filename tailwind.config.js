const colors = require("tailwindcss/colors");
const plugin = require("tailwindcss/plugin");

module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        xs: "425px",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        ".h": {
          display: "flex",
          "flex-direction": "row",
        },

        ".v": {
          display: "flex",
          "flex-direction": "column",
        },
      };

      addUtilities(newUtilities, ["responsive"]);
    }),
  ],
};
