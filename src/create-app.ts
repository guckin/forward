#!/usr/bin/env node
import {App} from 'aws-cdk-lib';

import {RestApiStack} from './rest-api/rest-api.stack';
import {CertificateStack} from './certificate/certificate.stack';
import {WebhookStatefulStack} from './webhook/webhook.stack';

const app = new App();
const stage = process.env.STAGE || 'dev';
const domainName = 'slippys.cool';
const subdomain = 'webhook';

const certStack = new CertificateStack(app, `Certificate-${stage}-Webhook`, {
    stage,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1'
    },
    crossRegionReferences: true,
    domainName,
    subdomain,
});

const webhookStack =  new WebhookStatefulStack(app, `WebhookStack-${stage}`, {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new RestApiStack(app, `WebhookRestAPIStack-${stage}`, {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    crossRegionReferences: true,
    stage,
    certStack,
    domainName,
    subdomain,
    webhookStack,
});
