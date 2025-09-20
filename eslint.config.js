import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        ignores: [
            ".next/**",
            "node_modules/**",
            ".git/**",
            "dist/**",
            "build/**",
            "*.min.js",
            "coverage/**",
            "*.config.js"
        ]
    },
    {
        rules: {
            "react/style-prop-object": "off",
            "@next/next/no-css-in-js": "off"
        }
    }
];

export default eslintConfig;
