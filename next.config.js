/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // This allows your other devices on the same network to access the app.
    // It is now a top-level property, NOT inside 'experimental'.
    // Make sure this IP address matches the "Network" address in your terminal output.
    experimental: {
        // In very recent versions, this has been moved out of experimental.
        // If the server warns about an unrecognized key, move the line below
        // out of the experimental block.
        allowedDevOrigins: ["http://192.168.1.25:3000"],
    },
};

module.exports = nextConfig;
