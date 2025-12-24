
import { processQueue } from '../services/ai/nudgeOrchestrator';

export async function runOnce(){
  const res = await processQueue(50);
  return res;
}
