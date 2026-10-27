/**
 * Aggregate and print request validation findings.
 *
 * Findings are stored as JSON lines so that several processes (vitest workers, the proxy) can append to the same
 * file. `node report.mts <file>` prints a summary grouped by operation and error, and emits GitHub Actions
 * `::warning::` annotations when running in CI. Pass `--fail` to exit non-zero when there is any finding.
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

export const formatReport = (groups: FindingGroup[], totalRequests?: number): string => {
    const lines: string[] = [];
    const total = groups.reduce((sum, group) => sum + group.count, 0);
    const scope = totalRequests === undefined ? '' : ` out of ${totalRequests} validated requests`;
    lines.push(`OpenAPI request validation: ${total} finding(s) in ${groups.length} group(s)${scope}`);
    let currentOperation = '';
    for (const group of groups) {
        if (group.operation !== currentOperation) {
            currentOperation = group.operation;
            lines.push('', currentOperation);
        }
        lines.push(`  [${group.kind}] ${group.message} (${group.count}x)`);
        for (const url of group.exampleUrls) lines.push(`      e.g. ${url}`);
    }
    return lines.join('\n');
};

export const formatAnnotations = (groups: FindingGroup[]): string[] =>
    groups.map(
        (group) =>
            `::warning title=OpenAPI request validation::${group.operation}: ${KIND_LABELS[group.kind]}: ${group.message} (${group.count}x, e.g. ${group.exampleUrls[0]})`,
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
    console.log(formatReport(groups));
    if (process.env.GITHUB_ACTIONS) {
        for (const line of formatAnnotations(groups)) console.log(line);
    }
    if (fail && groups.length > 0) process.exit(1);
};

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file://').href) main();
