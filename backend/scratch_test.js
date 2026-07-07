import 'dotenv/config';
import { analyzeDocument } from './src/services/geminiVision.js';

async function run() {
  try {
    const dummyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    await analyzeDocument(dummyImage, 'license');
  } catch (error) {
    console.log("Caught error in test script");
  }
}

run();
