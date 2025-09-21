// app-handler.js
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  if (event.httpMethod === 'GET') {
    // read items
    const res = await docClient.scan({ TableName: process.env.TABLE_NAME }).promise();
    return { statusCode: 200, body: JSON.stringify(res.Items) };
  } else if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const item = { pk: Date.now().toString(), ...body };
    await docClient.put({ TableName: process.env.TABLE_NAME, Item: item }).promise();
    return { statusCode: 201, body: JSON.stringify(item) };
  }
  return { statusCode: 400, body: 'Unsupported' };
};
