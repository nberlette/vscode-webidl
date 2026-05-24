import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Webpack configuration for bundling the WebIDL extension for the
 * browser environment. The bundled extension runs inside a WebWorker in
 * VSCode for Web and therefore cannot rely on Node.js APIs. Any
 * dependencies that expect Node features must either be shimmed or
 * bundled. The configuration below follows the pattern from the
 * official VSCode extension samples.
 *
 * Important: The code must be compiled to a single bundle. When
 * requiring modules in your extension code, use relative imports or
 * externalize only those packages that are available in the runtime.
 * @type {import('webpack').Configuration}
 */
export default {
  mode: "none",
  target: "webworker",
  entry: "./src/web/extension.ts",
  output: {
    filename: "extension.js",
    path: path.join(__dirname, "dist/web"),
    libraryTarget: "commonjs",
  },
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode",
  },
  resolve: {
    mainFields: ["browser", "module", "main"],
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
    extensions: [".ts", ".js"],
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
