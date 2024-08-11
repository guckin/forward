import {
    APIGatewayProxyEvent,
     APIGatewayProxyResult,
} from 'aws-lambda/trigger/api-gateway-proxy';
import {DynamoDBClient, PutItemCommand, QueryCommand} from '@aws-sdk/client-dynamodb';
import {randomUUID} from 'crypto';

export type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

const dynamoClient = new DynamoDBClient({});

const tableName = process.env.TABLE_NAME ?? '';

const getWebhookHandler: Handler = async () => {
    const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'userid = :userid',
        ExpressionAttributeValues: {
            ':userid': {S: 'user1'},
        },
    });
    const {Items} = await dynamoClient.send(command);
    const items = (Items ?? []).map(item => ({
        url: item.url.S,
        timestamp: parseInt(item.timestamp.N ?? '0'),
        id: item.id.S,
    }));
    return {
        statusCode: 200,
        body: JSON.stringify({items}),
    };
};

const postWebhooksHandler: Handler = async (event) => {
    const body = parseBody(event.body);
    const url = parseUrl(body.url);
    const command = new PutItemCommand({
        TableName: tableName,
        Item: {
            userid: {S: 'user1'},
            timestamp: {N: Date.now().toString()},
            url: {S: url.toString()},
            id: {S: randomUUID()},
        }
    });
    await dynamoClient.send(command);
    return {
        statusCode: 201,
        body: JSON.stringify({message: 'Webhook created'}),
    };
}

const parseUrl = (url?: string) => {
    try {
        return new URL(url ?? '');
    } catch (error) {
        throw {
            statusCode: 400,
            message: 'Invalid URL',
        };
    }
}


const parseBody = (body: string | null) => {
    try {
        return JSON.parse(body ?? '');
    } catch (error) {
        throw {
            statusCode: 400,
            message: 'Invalid JSON',
        };
    }
}

export const handler: Handler = async event => {
   try {
       if (event.httpMethod === 'GET' && event.path === '/webhooks') {
           return getWebhookHandler(event);
       } else if (event.httpMethod === 'POST' && event.path === '/webhooks') {
           return postWebhooksHandler(event);
       }
       else {
           return {
               statusCode: 404,
               body: JSON.stringify({message: 'Not found'}),
           };
       }
   } catch (error) {
       console.error('ERROR: ', error);
       if (isSerializableError(error)) {
           return {
                statusCode: error.statusCode,
                body: JSON.stringify({message: error.message}),
           };
       }
       return {
           statusCode: 500,
           body: JSON.stringify('Internal Server Error'),
       };
   }
};

function isSerializableError(error: unknown): error is { message: string, statusCode: number } {
    return typeof error === 'object' && error !== null && 'message' in error && 'statusCode' in error;
}
