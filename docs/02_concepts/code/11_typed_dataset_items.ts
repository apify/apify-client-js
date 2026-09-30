import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// The shape of the items the Actor stores, taken from its output schema.
interface Product {
    title: string;
    price: number;
}

// The type parameter types the items. The client doesn't validate them.
const { items } = await client.dataset<Product>('dataset-id').listItems();

for (const { title, price } of items) {
    console.log(`${title}: ${price}`);
}
