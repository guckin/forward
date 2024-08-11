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

    private table: Table;

    constructor(scope: Construct, id: string, props: WebhookStackProps) {
        super(scope, id, props);

        this.table = new Table(this, 'WebhookTable', {
            tableName: `WebhookTable${props.stage}`,
            partitionKey: {name: 'userid', type: AttributeType.STRING},
            sortKey: {name: 'timestamp', type: AttributeType.NUMBER},
            removalPolicy: RemovalPolicy.DESTROY
        });

        new Function(this, 'WebhooksRestApiHandler', {
            runtime: Runtime.NODEJS_18_X,
            handler: 'dispatcher.handler',
            code: Code.fromAsset(path.join(__dirname, '..', '..', 'build')),
            environment: {
                TABLE_NAME: this.getTableName()
            }
        });
    }

    public tableReadWrite(resource: IGrantable): void {
        this.table.grantReadWriteData(resource);
    }

    public getTableName(): string {
        return this.table.tableName;
    }

}
