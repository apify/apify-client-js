/**
 * Aggregate and print request validation findings.
 *
 * Findings are stored as JSON lines so that several processes (vitest workers, the proxy) can append to the same
 * file. `node report.mts <file>` prints one warning line per operation and error, as GitHub Actions `::warning::`
 * annotations when running in CI. Pass `--fail` to exit non-zero when there is any finding.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

import type { Finding } from './validator.mts';

const MAX_EXAMPLE_URLS = 3;

/** Return a sink that appends each finding to a JSON lines file. */
export const createJsonlSink =
    (file: string) =>
    (finding: Finding): void => {
        appendFileSync(file, `${JSON.stringify(finding)}\n`);
    };

export const loadFindings = (file: string): Finding[] => {
    if (!existsSync(file)) return [];
    return readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => JSON.parse(line) as Finding);
};

export interface FindingGroup {
    kind: Finding['kind'];
    operation: string;
    message: string;
    count: number;
    exampleUrls: string[];
}

/** Replace path segments that look like resource IDs so that the same operation groups together. */
const normalizePath = (url: string): string =>
    url
        .split('?')[0]
        .split('/')
        .map((segment) => (/^[A-Za-z0-9]{17}$|~/.test(segment) ? '{id}' : segment))
        .join('/');

export const aggregate = (findings: Finding[]): FindingGroup[] => {
    const groups = new Map<string, FindingGroup>();
    for (const finding of findings) {
        const operation = `${finding.method} ${finding.route ?? normalizePath(finding.url)}`;
        for (const error of finding.errors) {
            const message =
                error.path && finding.kind === 'invalid-request' ? `${error.path}: ${error.message}` : error.message;
            const key = `${finding.kind}|${operation}|${message}`;
            const group = groups.get(key) ?? { kind: finding.kind, operation, message, count: 0, exampleUrls: [] };
            group.count += 1;
            if (group.exampleUrls.length < MAX_EXAMPLE_URLS && !group.exampleUrls.includes(finding.url)) {
                group.exampleUrls.push(finding.url);
            }
            groups.set(key, group);
        }
    }
    return [...groups.values()].sort(
        (a, b) => a.operation.localeCompare(b.operation) || a.message.localeCompare(b.message),
    );
};

const KIND_LABELS: Record<Finding['kind'], string> = {
    'invalid-request': 'Request does not match the specification',
    'undocumented-operation': 'Operation is not in the specification',
    'validator-failure': 'Validator failed',
};

const describeGroup = (group: FindingGroup): string =>
    `${group.operation}: ${KIND_LABELS[group.kind]}: ${group.message} (${group.count}x, e.g. ${group.exampleUrls[0]})`;

/** One warning line per group; GitHub Actions renders the annotated form in the job summary and on the PR. */
export const formatWarnings = (groups: FindingGroup[], { annotations = false } = {}): string[] =>
    groups.map((group) =>
        annotations
            ? `::warning title=OpenAPI request validation::${describeGroup(group)}`
            : `Warning: ${describeGroup(group)}`,
    );

const main = (): void => {
    const args = process.argv.slice(2);
    const fail = args.includes('--fail');
    const file = args.find((arg) => !arg.startsWith('--'));
    if (!file) {
        console.error('Usage: node report.mts <findings.jsonl> [--fail]');
        process.exit(2);
    }
    const groups = aggregate(loadFindings(file));
    if (groups.length === 0) {
        console.log('OpenAPI request validation: every request matched the specification.');
        return;
    }
    for (const line of formatWarnings(groups, { annotations: Boolean(process.env.GITHUB_ACTIONS) })) console.log(line);
    if (fail) process.exit(1);
};

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file://').href) main();
