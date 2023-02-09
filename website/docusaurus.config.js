/* eslint-disable global-require,import/no-extraneous-dependencies */
const { config } = require('@apify/docs-theme');
const { externalLinkProcessor } = require('./tools/utils/externalLink');
const versions = require('./versions.json');

const { absoluteUrl } = config;
/** @type {Partial<import('@docusaurus/types').DocusaurusConfig>} */
module.exports = {
    title: 'Apify Documentation',
    tagline: 'Apify Documentation',
    url: absoluteUrl,
    baseUrl: '/api/client/js',
    trailingSlash: false,
    organizationName: 'apify',
    projectName: 'apify-client-js',
    favicon: 'img/favicon.ico',
    onBrokenLinks:
    /** @type {import('@docusaurus/types').ReportingSeverity} */ ('warn'),
    onBrokenMarkdownLinks:
    /** @type {import('@docusaurus/types').ReportingSeverity} */ ('warn'),
    themes: [
        [
            '@apify/docs-theme',
            /** @type { import('@apify/docs-theme/types').ThemeOptions } */
            {
                subNavbar: {
                    title: 'Apify Client JS',
                    items: [
                        {
                            to: 'docs',
                            label: 'Docs',
                            activeBaseRegex: '/docs(?!/changelog|/examples)',
                        },
                        // {
                        //     to: 'docs/examples',
                        //     label: 'Examples',
                        //     activeBaseRegex: '/docs/examples',
                        // },
                        {
                            to: 'reference',
                            label: 'Reference',
                            activeBaseRegex: '/reference',
                        },
                        {
                            to: 'docs/changelog',
                            label: 'Changelog',
                            activeBaseRegex: '/changelog',
                        },
                        {
                            href: 'https://github.com/apify/apify-client-js',
                            label: 'GitHub',
                        },
                        {
                            'type': 'docsVersionDropdown',
                            'position': 'left',
                            'className': 'navbar__item', // fixes margin around dropdown - hackish, should be fixed in theme
                            'data-api-links': JSON.stringify([
                                'reference/next',
                                ...versions.map((version, i) => (i === 0 ? 'reference' : `reference/${version}`)),
                            ]),
                            'dropdownItemsBefore': [],
                            'dropdownItemsAfter': [],
                        },
                    ],
                },
            },
        ],
    ],
    presets: /** @type {import('@docusaurus/types').PresetConfig[]} */ ([
        [
            '@docusaurus/preset-classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    path: '../docs',
                    sidebarPath: './sidebars.js',
                    rehypePlugins: [externalLinkProcessor],
                },
            }),
        ],
    ]),
    plugins: [
        [
            'docusaurus-plugin-typedoc-api',
            {
                projectRoot: `${__dirname}/..`,
                changelogs: false,
                readmes: false,
                packages: [{ path: '.' }],
                typedocOptions: {
                    excludeExternals: false,
                },
                routeBasePath: '/reference',
            },
        ],
        // [
        //     'docusaurus-gtm-plugin',
        //     {
        //         id: 'GTM-TKBX678',
        //     },
        // ],
    ],
    themeConfig: config.themeConfig,
    staticDirectories: ['node_modules/@apify/docs-theme/static', 'static'],
};
