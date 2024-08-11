#!/usr/bin/env node
import {App} from 'aws-cdk-lib';
import {RestApiStack} from './rest-api/rest-api.stack';
import {CertificateStack} from './certificate/certificate.stack';
import {WebhookStack} from './webhook/webhook.stack';
import {TestServiceStack} from './test-service/test-service.stack';

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

const webhookStack =  new WebhookStack(app, `WebhookStack-${stage}`, {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    stage,
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

const testCertStack = new CertificateStack(app, `Test-Certificate-${stage}`, {
    stage,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1'
    },
    crossRegionReferences: true,
    domainName,
    subdomain: 'test-service'
});

new TestServiceStack(app, `TestServiceStack-${stage}`, {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    stage,
    domainName,
    subdomain: 'test-service',
    certStack: testCertStack,
});
