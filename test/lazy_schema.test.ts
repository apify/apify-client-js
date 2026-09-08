import { describe, expect, test, vi } from 'vitest';

import { lazySchema } from '../src/lazy_schema.js';

describe('lazySchema', () => {
    test('builds on the first call only and returns the same instance afterwards', () => {
        const build = vi.fn(() => ({}));
        const schema = lazySchema(build);

        expect(build).not.toHaveBeenCalled();

        const first = schema();

        expect(schema()).toBe(first);
        expect(build).toHaveBeenCalledTimes(1);
    });
});
