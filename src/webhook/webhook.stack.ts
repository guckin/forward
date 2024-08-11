import {Construct} from 'constructs';
import {AttributeType, Table} from 'aws-cdk-lib/aws-dynamodb';
import {IGrantable} from 'aws-cdk-lib/aws-iam';
import {RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import {Code, Function, Runtime} from 'aws-cdk-lib/aws-lambda';
import path from 'path';


export type WebhookStackProps = StackProps & {
    stage: string,
};

export class WebhookStack extends Stack {

    private webhookTable: Table;
    private eventRecordsTable: Table;

    constructor(scope: Construct, id: string, props: WebhookStackProps) {
        super(scope, id, props);

        this.webhookTable = new Table(this, 'WebhookTable', {
            tableName: `WebhookTable${props.stage}`,
            partitionKey: {name: 'userid', type: AttributeType.STRING},
            sortKey: {name: 'timestamp', type: AttributeType.NUMBER},
            removalPolicy: RemovalPolicy.DESTROY
        });

        this.eventRecordsTable = new Table(this, 'EventTable', {
            tableName: `EventTable${props.stage}`,
            partitionKey: {name: 'webhookId', type: AttributeType.STRING},
            sortKey: {name: 'timestamp', type: AttributeType.NUMBER},
            removalPolicy: RemovalPolicy.DESTROY
        });


        const tableNames = this.getTableNames();
        const fn = new Function(this, 'DispatcherHandler', {
            runtime: Runtime.NODEJS_18_X,
            handler: 'dispatcher.handler',
            description: 'Dispatches webhook events to registered webhooks.',
            code: Code.fromAsset(path.join(__dirname, '..', '..', 'build', 'dispatcher')),
            environment: {
                TABLE_NAME: tableNames.webhookTableName,
                EVENT_RECORDS_TABLE_NAME: tableNames.eventRecordsTableName
            }
        });

        this.webhookTable.grantReadWriteData(fn);
        this.eventRecordsTable.grantReadWriteData(fn);
    }

    public tableReadWrite(resource: IGrantable): void {
        this.webhookTable.grantReadWriteData(resource);
        this.eventRecordsTable.grantReadWriteData(resource);
    }

    public getTableNames(): {webhookTableName: string, eventRecordsTableName: string} {
        return {
            webhookTableName: this.webhookTable.tableName,
            eventRecordsTableName: this.eventRecordsTable.tableName
        };
    }

}
