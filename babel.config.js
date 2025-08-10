// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Path alias so Metro resolves "@/..."
      [
        "module-resolver",
        {
          alias: { "@": "./" },
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      ],
      // Reanimated must be last
      "react-native-reanimated/plugin",
    ],
  };
};
