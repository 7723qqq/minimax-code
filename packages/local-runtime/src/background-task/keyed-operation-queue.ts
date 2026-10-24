/**
 * Serializes background-task operations per key.
 *
 * This is `KeyedOperationLane` under the name the background-task module already
 * imports. The two implementations were identical: chain the operation after the
 * previous holder for the same key, and drop the entry when this operation is the
 * tail. Keeping a local name avoids touching every call site while removing the
 * duplicate logic.
 *
 * `KeyedOperationLane` also ignores a failed predecessor, which this queue did
 * through its `catch(() => undefined)` link, so calls behind a rejected operation
 * still run.
 */
export { KeyedOperationLane as KeyedOperationQueue } from '@mavis/shared/keyed-operation-lane';
