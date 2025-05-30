import React from 'react';
import { useVersions, useActiveDocContext, useDocsVersionCandidates } from '@docusaurus/plugin-content-docs/client';
import { useDocsPreferredVersion } from '@docusaurus/theme-common';
import { translate } from '@docusaurus/Translate';
import { useLocation } from '@docusaurus/router';
import DefaultNavbarItem from '@theme/NavbarItem/DefaultNavbarItem';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';

const getVersionMainDoc = (version) => version.docs.find((doc) => doc.id === version.mainDocId);

function getApiLinks(props, pathname) {
    if (!pathname.startsWith('/api/client/js/reference')) {
        return [];
    }

    try {
        return JSON.parse(props['data-api-links']);
    } catch {
        return [];
    }
}

/* eslint-disable react/prop-types */
export default function DocsVersionDropdownNavbarItem({
    mobile,
    docsPluginId,
    dropdownActiveClassDisabled,
    dropdownItemsBefore,
    dropdownItemsAfter,
    ...props
}) {
    const { search, hash, pathname } = useLocation();
    const apiLinks = getApiLinks(props, pathname);

    const activeDocContext = useActiveDocContext(docsPluginId);
    const versions = useVersions(docsPluginId);
    const { savePreferredVersionName } = useDocsPreferredVersion(docsPluginId);
    const versionLinks = versions.map((version, idx) => {
        // We try to link to the same doc, in another version
        // When not possible, fallback to the "main doc" of the version
        const versionDoc = activeDocContext.alternateDocVersions[version.name] ?? getVersionMainDoc(version);
        return {
            label: version.label,
            // preserve ?search#hash suffix on version switches
            to: `${apiLinks[idx] ?? versionDoc.path}${search}${hash}`,
            isActive: () => version === activeDocContext.activeVersion,
            onClick: () => savePreferredVersionName(version.name),
        };
    });
    const items = [...dropdownItemsBefore, ...versionLinks, ...dropdownItemsAfter];
    const dropdownVersion = useDocsVersionCandidates(docsPluginId)[0];
    // Mobile dropdown is handled a bit differently
    const dropdownLabel =
        mobile && items.length > 1
            ? translate({
                  id: 'theme.navbar.mobileVersionsDropdown.label',
                  message: 'Versions',
                  description: 'The label for the navbar versions dropdown on mobile view',
              })
            : dropdownVersion.label;
    let dropdownTo = mobile && items.length > 1 ? undefined : getVersionMainDoc(dropdownVersion).path;

    if (dropdownTo && pathname.startsWith('/api/client/js/reference')) {
        dropdownTo = versionLinks.find((v) => v.label === dropdownVersion.label)?.to;
    }

    // We don't want to render a version dropdown with 0 or 1 item. If we build
    // the site with a single docs version (onlyIncludeVersions: ['1.0.0']),
    // We'd rather render a button instead of a dropdown
    if (items.length <= 1) {
        return (
            <DefaultNavbarItem
                {...props}
                mobile={mobile}
                label={dropdownLabel}
                to={dropdownTo}
                isActive={dropdownActiveClassDisabled ? () => false : undefined}
            />
        );
    }
    return (
        <DropdownNavbarItem
            {...props}
            mobile={mobile}
            label={dropdownLabel}
            to={dropdownTo}
            items={items}
            isActive={dropdownActiveClassDisabled ? () => false : undefined}
        />
    );
}
