module.exports = {
    hooks: {
        readPackage(pkg) {
            // openapi-typescript builds its output with the TypeScript JS API, which the native TS 7 compiler at the
            // root no longer ships. Its `typescript` peer would resolve to that root copy, so turn it into a regular
            // dependency on TS 6, which pnpm nests under it (like typedoc gets TS 6 through the website's pin).
            if (pkg.name === 'openapi-typescript') {
                delete pkg.peerDependencies?.typescript;
                pkg.dependencies = { ...pkg.dependencies, typescript: '^6.0.3' };
            }
            return pkg;
        },
    },
};
