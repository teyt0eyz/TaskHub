import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Pin the workspace root to this project so Next doesn't pick the
  // parent directory (a stray lockfile lives in the home folder).
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
