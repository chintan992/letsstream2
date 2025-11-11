// @ts-check

/** @type {import("prettier").Config} */
export default {
  // Max line length
  printWidth: 80,
  // Number of spaces for indentation
  tabWidth: 2,
  // Use spaces instead of tabs
  useTabs: false,
  // Add semicolons at the end of statements
  semi: true,
  // Use single quotes instead of double quotes
  singleQuote: false,
  // Add trailing commas where valid in ES5 (objects, arrays, etc.)
  trailingComma: "es5",
  // Print spaces between brackets in object literals
  bracketSpacing: true,
  // Put the > of a multi-line JSX element at the end of the last line
  jsxBracketSameLine: false,
  // Format files with a range starting and ending at the given positions (inclusive)
  rangeStart: 0,
  // Require parentheses around arrow function arguments
  arrowParens: "avoid",
  // Specify the global whitespace sensitivity for markup
  htmlWhitespaceSensitivity: "css",
  // Respect .editorconfig
  useEditorConfig: false,
  // Enforce single attribute per line in HTML, Vue, and JSX
  singleAttributePerLine: false,
  // Plugin configuration
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind CSS specific settings
  tailwindConfig: "./tailwind.config.ts",
  // End of line
  endOfLine: "lf",
};
