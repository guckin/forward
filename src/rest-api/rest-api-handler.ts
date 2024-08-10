import {
    APIGatewayProxyEventV2,
    APIGatewayProxyResultV2
} from 'aws-lambda/trigger/api-gateway-proxy';

export type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;


const getWebhookHandler: Handler = async () => {
    return {
        statusCode: 200,
        body: JSON.stringify({items: []}),
    };
};

const postWebhooksHandler: Handler = async (event) => {
    const body = parseBody(event.body);
    const url = parseUrl(body.url);
    console.log(url);
    return {
        statusCode: 201,
        body: JSON.stringify({message: 'Webhook created'}),
    };
}

const parseUrl = (url?: string) => {
    try {
        new URL(url ?? '');
    } catch (error) {
        throw {
            statusCode: 400,
            message: 'Invalid URL',
        };
    }
    return url;
}


const parseBody = (body?: string) => {
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
       if (event.requestContext.http.method === 'GET' && event.rawPath === '/webhooks') {
           return getWebhookHandler(event);
       } else if (event.requestContext.http.method === 'POST' && event.rawPath === '/webhooks') {
           return postWebhooksHandler(event);
       }
       else {
           return {
               statusCode: 404,
               body: JSON.stringify({message: 'Not found'}),
           };
       }
   } catch (error) {
       if (isSerializableError(error)) {
           return {
                statusCode: error.statusCode,
                body: JSON.stringify({message: error.message}),
           };
       }
       return {
           statusCode: 500,
           body: JSON.stringify({message: 'Internal server error'}),
       };
   }
};

function isSerializableError(error: unknown): error is { message: string, statusCode: number } {
    return typeof error === 'object' && error !== null && 'message' in error && 'statusCode' in error;
}
