// webhook.js

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const MAX_RETRIES = 3;

// Generate signature for payload
function generateSignature(payload, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
}

// Trigger webhooks for a specific event
import logger from './_logger.js';

async function triggerWebhooks(event, payload) {
    logger.debug(`Triggering webhooks for event: ${event} with payload: ${JSON.stringify(payload)}`);

    const webhooks = await prisma.webhook.findMany({
        where: { event },
    });

    logger.debug(`Found ${webhooks.length} webhooks for event: ${event}`);

    await Promise.all(
        webhooks.map(async (webhook) => {
            logger.debug(`Sending webhook to URL: ${webhook.url} with ID: ${webhook.id}`);
            return sendWebhook(webhook, payload);
        })
    );
}

// Send webhook with retries
async function sendWebhook(webhook, payload, retryCount = 0) {
    logger.info(`Attempting to send webhook with ID: ${webhook.id} to URL: ${webhook.url}`);
    const signature = generateSignature(payload, webhook.secret);
    logger.info(`Generated signature for webhook ID: ${webhook.id}`);
    try {
        logger.info(`Sending payload to ${webhook.url} with signature ${signature}`);

        const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
            },
            body: JSON.stringify(payload),
            timeout: 5000
        });

        logger.debug(`Webhook response for ID ${webhook.id}: ${response.status} - ${response.statusText}`);

        if (response.status === 200) {
            logger.info(`Webhook ${webhook.id} sent successfully.`);
            await logWebhookSuccess(webhook.id, payload);
        } else {
            throw new Error(`Webhook responded with status ${response.status}`);
        }
    } catch (error) {
        logger.error(`Failed to trigger webhook ${webhook.id}: ${error.message}`);
        await logWebhookFailure(webhook.id, payload, error);

        if (retryCount < MAX_RETRIES) {
            logger.warn(`Retrying webhook ${webhook.id}, attempt ${retryCount + 1}`);
            setTimeout(() => sendWebhook(webhook, payload, retryCount + 1), 2 ** retryCount * 1000);
        } else {
            logger.error(`Failed to trigger webhook ${webhook.id} after ${MAX_RETRIES} attempts. No further retries will be made.`);
        }

    }
}

// Log successful webhook delivery
async function logWebhookSuccess(webhookId, payload) {
    await prisma.webhookLog.create({
        data: {
            webhookId,
            status: 'SUCCESS',
            payload: JSON.stringify(payload),
        },
    });
}

// Log failed webhook delivery
async function logWebhookFailure(webhookId, payload, errorMessage) {
    await prisma.webhookLog.create({
        data: {
            webhookId,
            status: 'FAILURE',
            payload: JSON.stringify(payload),
            errorMessage,
        },
    });
}

export { triggerWebhooks };