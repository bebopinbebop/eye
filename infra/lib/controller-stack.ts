import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ControllerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const controllerFn = new lambda.Function(this, 'ControllerFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'controller.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.seconds(30),
      environment: { TARGET_STACK_NAME: 'AppStack' }
    });

    // Policy so the controller can create/delete CloudFormation stacks
    controllerFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudformation:CreateStack', 'cloudformation:DeleteStack', 'cloudformation:DescribeStacks', 'cloudformation:ListStacks'],
      resources: ['*'] // or narrow by ARN for better security
    }));

    // EventBridge rule to CREATE stack at 01:00 local time (we set timezone below)
    const createRule = new events.Rule(this, 'CreateRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '1', month: '*', weekDay: '*', year: '*' })
      // Note: by default cron in EventBridge is UTC. If you want timezone support, use EventBridge Scheduler constructs or include timezone conversion when defining cron.
    });
    createRule.addTarget(new targets.LambdaFunction(controllerFn, { event: events.RuleTargetInput.fromObject({ action: 'create' }) }));

    // EventBridge rule to DELETE stack at 12:00
    const deleteRule = new events.Rule(this, 'DeleteRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '12', month: '*', weekDay: '*', year: '*' })
    });
    deleteRule.addTarget(new targets.LambdaFunction(controllerFn, { event: events.RuleTargetInput.fromObject({ action: 'delete' }) }));
  }
}
