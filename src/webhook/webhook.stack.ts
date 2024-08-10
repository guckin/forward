import {Construct} from 'constructs';
import {AttributeType, Table} from 'aws-cdk-lib/aws-dynamodb';
import {IGrantable} from 'aws-cdk-lib/aws-iam';
import {Stack, StackProps} from 'aws-cdk-lib';
import {Code, Function, Runtime} from 'aws-cdk-lib/aws-lambda';
import path from 'path';

export class WebhookStack extends Stack {

    private table: Table;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        this.table = new Table(this, 'WebhookTable', {
            tableName: 'WebhookTable',
            partitionKey: {name: 'userid', type: AttributeType.STRING},
            sortKey: {name: 'timestamp', type: AttributeType.NUMBER},
        });

        new Function(this, 'WebhooksRestApiHandler', {
            runtime: Runtime.NODEJS_18_X,
            handler: 'dispatcher.handler',
            code: Code.fromAsset(path.join(__dirname, '..', '..', 'build')),
        });
    }

    public tableReadWrite(resource: IGrantable): void {
        this.table.grantReadWriteData(resource);
    }

}
