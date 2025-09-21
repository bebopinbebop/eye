#!/usr/bin/env node

// This is the creation of the Stacks, a Controller Stack to automate cycles of creation and destruction, and the AppStack, the actual guts of the App

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ControllerStack } from '../lib/controller-stack';
import { AppStack } from '../lib/app-stack';

const app = new cdk.App();

// Change env/region/account as needed
new ControllerStack(app, 'ControllerStack', {});

new AppStack(app, 'AppStack', {});
