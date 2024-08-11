// eslint-disable-next-line unused-imports/no-unused-imports,unused-imports/no-unused-vars,@typescript-eslint/no-unused-vars
/* global fetch */
import fetch from 'node-fetch';
import {Webhook} from './model';
import {DynamoDBClient, PutItemCommand, QueryCommand} from '@aws-sdk/client-dynamodb';
import {Event} from './model';

const dynamoClient = new DynamoDBClient({});
const tableName = process.env.TABLE_NAME ?? '';
const eventsRecordTableName = process.env.EVENT_RECORDS_TABLE_NAME ?? '';

export const handler = async (event: Event): Promise<void> => {
    const webhooks = await listWebhooks(event.userId);
    const results = await Promise.all(webhooks.map(webhook => dispatchWebhook(webhook, event)));
    for (const result of results) {
        if (result.success) {
            await storeSuccess(result);
        } else {
            console.error(result.reason);
            await storeFailure(result);
        }
    }
};

async function listWebhooks(userId: string): Promise<Webhook[]> {
    const command = new QueryCommand({
        TableName: tableName,
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
        webhookId: item.id.S ?? '',
    }));
}

type Success = {success: true, webhookId: string, event: Event};
type Failure = {success: false, webhookId: string, event: Event, reason: string};
type Result = Success | Failure;

async function dispatchWebhook(webhook: Webhook, event: Event): Promise<Result> {
    try {
        const result = await fetch(webhook.url, {method: 'POST', body: JSON.stringify(event)});
        if (result.ok) {
            return {success: true, webhookId: webhook.webhookId, event};
        }
        return {
            success: false,
            webhookId: webhook.webhookId,
            event,
            reason: `HTTP status code: ${result.status}, body: ${await result.text()}`
        };
    } catch (error) {
        const reason = error instanceof Error ? error.message : `Unknown error: ${JSON.stringify(error)}`;
        return {success: false, webhookId: webhook.webhookId, event, reason};
    }
}

async function storeSuccess(result: Success): Promise<void> {
    const {webhookId, event} = result;
    await dynamoClient.send(new PutItemCommand({
        TableName: eventsRecordTableName,
        Item: {
            userId: {S: event.userId},
            timestamp: {N: event.timestamp.toString()},
            type: {S: event.type},
            success: {BOOL: true},
            eventId: {S: event.eventId},
            webhookId: {S: webhookId},
        }
    }));
}

async function storeFailure(result: Failure): Promise<void> {
    const {webhookId, event, reason} = result;
    await dynamoClient.send(new PutItemCommand({
        TableName: eventsRecordTableName,
        Item: {
            userId: {S: event.userId},
            timestamp: {N: event.timestamp.toString()},
            type: {S: event.type},
            success: {BOOL: false},
            reason: {S: reason},
            eventId: {S: event.eventId},
            webhookId: {S: webhookId},
        }
    }));
}
