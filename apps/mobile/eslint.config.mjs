import { ourongxing, react } from "@ourongxing/eslint-config"

export default ourongxing({
  type: "app",
  ignores: [".expo/", "android/", "ios/", "node_modules/", "assets/", "**/*.json"],
}).append(react({
  files: ["src/**", "app/**"],
}))

