export type Webhook = {
    url: string,
    timestamp: number,
    userId: string,
    webhookId: string,
};

export type Event = {
    type: 'TEST_EVENT',
    userId: string,
    timestamp: number,
    eventId: string,
}
