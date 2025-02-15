import prisma from './_prisma.ts';

export default async function handleBundleUsageEvent(tx, bundleId, reservationId, type, quantity) {
    const _prisma = tx || prisma
    try {
        const bundleUsageEvent = await _prisma.bundleUsageEvent.create({
            data: {
                bundle: { connect: { id: bundleId } },
                reservation: { connect: { id: reservationId } },
                type,
                quantity,
            },
        });

        console.log(`Bundle usage event created: ${bundleUsageEvent.id}`);
        return bundleUsageEvent;
    } catch (error) {
        console.error('Error creating bundle usage event:', error);
        throw error;
    }
}