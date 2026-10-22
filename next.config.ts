import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // An empty lockfile in the home directory otherwise becomes the Turbopack
  // root, so `next dev` watches the whole home folder and exhausts memory.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
