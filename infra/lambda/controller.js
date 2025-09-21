// controller.js
const AWS = require('aws-sdk');
const cf = new AWS.CloudFormation({ apiVersion: '2010-05-15' });
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log('Controller invoked, event:', JSON.stringify(event));
  const action = event.action || (event.detail && event.detail.action);

  const stackName = process.env.TARGET_STACK_NAME || 'AppStack';

  if (action === 'create') {
    // Create the stack from a local template stored in an S3 bucket or inline template string.
    // Simpler: we assume a template body is uploaded to an S3 bucket you control.
    const templateBucket = process.env.TEMPLATE_BUCKET; // optional
    const templateKey = process.env.TEMPLATE_KEY || 'app-stack-template.yml';

    try {
      // Example: create stack from S3 template URL (replace with where you store the template)
      const params = {
        StackName: stackName,
        TemplateURL: `https://${templateBucket}.s3.amazonaws.com/${templateKey}`,
        Capabilities: ['CAPABILITY_NAMED_IAM'],
        Parameters: []
      };
      await cf.createStack(params).promise();
      console.log('CreateStack requested');
      return { status: 'create_requested' };
    } catch (err) {
      console.error(err);
      throw err;
    }
  } else if (action === 'delete') {
    try {
      await cf.deleteStack({ StackName: stackName }).promise();
      console.log('DeleteStack requested');
      return { status: 'delete_requested' };
    } catch (err) {
      console.error(err);
      throw err;
    }
  } else {
    console.log('No action recognized; exiting');
    return { status: 'no_action' };
  }
};
