import type { ActorChargeEvent, PricePerDatasetItemActorPricingInfo } from 'apify-client';
import { describe, expect, test } from 'vitest';

describe('Actor pricing types', () => {
    test('represent tiered pricing without a flat price', () => {
        const event: ActorChargeEvent = {
            eventTitle: 'Processed item',
            eventDescription: 'An item was processed.',
            eventTieredPricingUsd: {
                STARTER: { tieredEventPriceUsd: 0.01 },
            },
            isPrimaryEvent: true,
            isOneTimeEvent: false,
        };
        const datasetItemPricing: PricePerDatasetItemActorPricingInfo = {
            pricingModel: 'PRICE_PER_DATASET_ITEM',
            unitName: 'result',
            tieredPricing: {
                STARTER: { tieredPricePerUnitUsd: 0.02 },
            },
            apifyMarginPercentage: 0.2,
            createdAt: new Date(),
            startedAt: new Date(),
            isPriceChangeNotificationSuppressed: true,
            forceContainsSignificantPriceChange: false,
        };

        expect(event.eventPriceUsd).toBeUndefined();
        expect(datasetItemPricing.pricePerUnitUsd).toBeUndefined();
        expect(event.eventTieredPricingUsd?.STARTER.tieredEventPriceUsd).toBe(0.01);
        expect(datasetItemPricing.tieredPricing?.STARTER.tieredPricePerUnitUsd).toBe(0.02);
    });
});
