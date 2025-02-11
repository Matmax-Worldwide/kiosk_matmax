import prisma from './_prisma.js';

export default async function calculateBundleRemainingUses(tx, bundleId) {
    const _prisma = tx || prisma

    // 1. Fetch the bundle and its items
    const bundle = await _prisma.bundle.findUnique({
        where: { id: bundleId },
        include: {
            bundleItems: true,
            bundleUsageEvents: true
        }
    });

    if (!bundle) {
        throw new Error('Bundle not found');
    }

    // 2. Initialize remaining uses
    let remainingSessions = bundle.bundleItems
        .filter((item) => item.type === 'SESSION')
        .reduce((sum, item) => sum + item.quantity, 0);

    // 3. Apply usage events
    for (const event of bundle.bundleUsageEvents) {
        switch (event.type) {
            case 'USE':
                remainingSessions -= event.quantity;
                break;
            case 'REFUND':
                remainingSessions += event.quantity;
                break;
            case 'EXPIRE':
            case 'CANCEL':
                remainingSessions = 0;
                break;
        }
    }

    // 4. Ensure no negative value
    remainingSessions = Math.max(remainingSessions, 0);

    return remainingSessions;
}