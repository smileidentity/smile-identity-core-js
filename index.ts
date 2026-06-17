import { IDApi } from './src/id-api.js';
import Signature from './src/signature.js';
import { Utilities } from './src/utilities.js';
import { WebApi } from './src/web-api.js';
import { JOB_TYPE, IMAGE_TYPE } from './src/constants.js';

if (
  (typeof process === 'undefined' &&
    typeof (process as NodeJS.Process).versions.node === 'undefined') ||
  typeof window !== 'undefined'
) {
  console.warn(
    'This is a server-side library meant for a node.js (or compatible) runtime, and is not meant to work in the browser.',
  );
}

export { IDApi, Signature, Utilities, WebApi, JOB_TYPE, IMAGE_TYPE };
