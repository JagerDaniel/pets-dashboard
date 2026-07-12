/**
 * Test/example posting flag.
 *
 * Every posting currently in the feature service is a test submission made
 * while building the dashboard, so they are all flagged as examples in the
 * UI, the Facebook share text, and the exported poster.
 *
 * Once real reports start arriving, set TEST_CUTOFF_OBJECTID to the objectid
 * of the last test submission — anything at or below it stays flagged, and
 * newer (real) postings display normally. Set it to 0 to stop flagging
 * everything.
 */
export const TEST_CUTOFF_OBJECTID = Infinity;

export function isTestPet(objectid) {
  return objectid != null && objectid <= TEST_CUTOFF_OBJECTID;
}
