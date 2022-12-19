import { IDApi } from './src/id-api';
import Signature from './src/signature';
import { Utilities } from './src/utilities';
import { WebApi } from './src/web-api';
import { JOB_TYPE, IMAGE_TYPE } from './src/constants';

if ((typeof process === 'undefined' && typeof (process as NodeJS.Process).versions.node === 'undefined') || typeof window !== 'undefined') {
  console.error('This is a server-side library meant for a node.js (or compatible) runtime, and is not meant to work in the browser.');
}


export { IDApi, Signature, Utilities, WebApi, JOB_TYPE, IMAGE_TYPE }