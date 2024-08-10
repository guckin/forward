import {Construct} from 'constructs';
import {AttributeType, Table} from 'aws-cdk-lib/aws-dynamodb';
import {IGrantable} from 'aws-cdk-lib/aws-iam';
import {Stack, StackProps} from 'aws-cdk-lib';

export class WebhookStack extends Stack {

    private table: Table;

    constructor(scope: Construct, id: string,) {
        super(scope, id);

        this.table = new Table(this, 'WebhookTable', {
            tableName: 'WebhookTable',
            partitionKey: {name: 'userid', type: AttributeType.STRING},
            sortKey: {name: 'timestamp', type: AttributeType.NUMBER},
        });
    }

    public tableReadWrite(resource: IGrantable): void {
        this.table.grantReadWriteData(resource);
    }

}
