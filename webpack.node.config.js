import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @typedef {import('webpack').Configuration} WebpackConfig */

/** @type {WebpackConfig} */
const config = {
  mode: "none",
  target: "node",
  entry: "./src/extension.ts",
  output: {
    filename: "extension.cjs",
    path: path.join(__dirname, "dist"),
    libraryTarget: "commonjs2",
  },
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode",
  },
  resolve: {
    mainFields: ["module", "main"],
    extensionAlias: {
      ".js": [".ts", ".js", ".mts", ".mjs"],
    },
    extensions: [".ts", ".js", ".mts", ".mjs"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.json",
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
};

export default config;
