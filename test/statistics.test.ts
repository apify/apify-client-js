import { Statistics } from '../src/statistics';

describe('Statistics', () => {
    test.each([
        [[1], [1]],
        [[1, 5], [1, 0, 0, 0, 1]],
        [[5, 1], [1, 0, 0, 0, 1]],
        [[3, 5, 1], [1, 0, 1, 0, 1]],
        [[1, 5, 3], [1, 0, 1, 0, 1]],
        [[2, 1, 2, 1, 5, 2, 1], [3, 3, 0, 0, 1]],
    ])('addRateLimitError() works with %s', (attempts, errors) => {
        const stats = new Statistics();
        attempts.forEach((a) => stats.addRateLimitError(a));
        expect(stats.rateLimitErrors).toEqual(errors);
    });

    test('addRateLimitError() throws with 0', () => {
        const stats = new Statistics();
        expect(() => stats.addRateLimitError(0)).toThrow();
    });
});
