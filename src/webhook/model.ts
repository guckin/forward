export type Webhook = {
    url: string,
    timestamp: number,
    userId: string,
};

export type Event = {
    type: 'TEST_EVENT',
    userId: string,
}
