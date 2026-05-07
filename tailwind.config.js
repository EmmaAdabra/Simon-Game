/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/*.html"],
  theme: {
    extend: {
      colors: {
        settingsBg: "#FBF6EE",
        gameBg: "#F6F1E9",
        levelBg: "#330000",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        "scrollbar-thin": {
          scrollbarWidth: "thin",
          scrollbarColor: "#1f2937 transparent"
        },
        ".scrollbar-webkit": {
          "&::-webkit-scrollbar": {
            width: "5px"
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent"
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#1f2937",
            border: "1px solid white",
            borderRadius: "20px",
            minHeight: "20px"
          },
        },
      };
      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
};
