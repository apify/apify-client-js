import { ApifyClient, ArgumentValidationError } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    // @ts-expect-error TypeScript rejects the string at compile time, plain JavaScript reaches the runtime check.
    await client.dataset('my-dataset').listItems({ limit: 'ten' });
} catch (error) {
    if (error instanceof ArgumentValidationError) {
        // Invalid input: expected number, received the string `ten` at `limit` in `DatasetClientListItemOptions`
        console.log(error.message);
        // [{ code: 'invalid_type', expected: 'number', path: ['limit'], ... }]
        console.log(error.issues);
    }
}
