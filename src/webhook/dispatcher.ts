import fetch from 'node-fetch';
import {Webhook} from './model';
import {DynamoDBClient, QueryCommand} from '@aws-sdk/client-dynamodb';
import {Event} from './model';

const dynamoClient = new DynamoDBClient({});

export const handler = async (event: Event): Promise<void> => {
    const webhooks = await listWebhooks(event.userId);
    const results = await Promise.allSettled(webhooks.map(webhook => dispatchWebhook(webhook)));
    results.forEach(result => {
        if (result.status === 'rejected') {
            console.error(result.reason);
        }
    });
};

async function listWebhooks(userId: string): Promise<Webhook[]> {
    const command = new QueryCommand({
        TableName: 'WebhookTable',
        KeyConditionExpression: 'userid = :userid',
        ExpressionAttributeValues: {
            ':userid': {S: userId},
        },
    });
    const {Items} = await dynamoClient.send(command);
    return (Items ?? []).map(item => ({
        url: item.url.S ?? '',
        timestamp: parseInt(item.timestamp.N ?? '0'),
        userId: item.userid.S ?? '',
    }));
};

async function dispatchWebhook(webhook: Webhook): Promise<void> {
    await fetch(webhook.url, {method: 'POST', body: JSON.stringify({timestamp: webhook.timestamp})});
};
