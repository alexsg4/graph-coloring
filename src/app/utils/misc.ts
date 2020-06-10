/**
 * Builds a dummy promise that resolves after a given time.
 * To be used with await to pause the current method inside which delay is called.
 *
 * @param ms - time in miliseconds
 */
export function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}
