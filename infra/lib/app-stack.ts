// This is a Infrastructure as Code solution written in Typescript , building an S3 bucket, DynamoDB, Cognito User Pool, Lambda function and an API Gateway


import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket (for uploads/assets) - private
    const bucket = new s3.Bucket(this, 'AppBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    // DynamoDB table
    const table = new dynamodb.Table(this, 'AppTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'AppUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'AppUserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: { userPassword: true, userSrp: true }
    });

    // Lambda that will be our one server-side function
    const fn = new lambda.Function(this, 'AppHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'app-handler.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: bucket.bucketName
      },
      timeout: cdk.Duration.seconds(10)
    });

    // Give Lambda permissions
    table.grantReadWriteData(fn);
    bucket.grantReadWrite(fn);

    // API Gateway in front of the Lambda
    const api = new apigw.LambdaRestApi(this, 'AppApi', {
      handler: fn,
      proxy: true
    });

    // Outputs for app client
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
  }
}
