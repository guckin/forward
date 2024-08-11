import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda/trigger/api-gateway-proxy';

export type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

const requestBodies: string[] = [];

export const handler: Handler = async event => {
    console.log('event', event);
    if (event.path === '/endpoint') {
        requestBodies.push(event.body || '');
        return {
            statusCode: 200,
            body: JSON.stringify({message: 'Request received'}),
        };
    }
    if (event.path === '/request-bodies') {
        return {
            statusCode: 200,
            body: JSON.stringify(requestBodies),
        };
    }
    return {
        statusCode: 404,
        body: JSON.stringify({message: 'Not found'}),
    }
};
