import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";

type TrackedRecord = Record<string, unknown>;

/**
 * Tracks a snapshot of an object and computes the shallow diff of changed
 * top-level keys against the last tracked snapshot.
 */
export default class ChangeTracker {
	private store: TrackedRecord = {};

	track(object: TrackedRecord): void {
		this.store = cloneDeep(object);
	}

	getChange(newData: TrackedRecord): Partial<TrackedRecord> {
		const result: Partial<TrackedRecord> = {};
		for (const [key, value] of Object.entries(newData)) {
			if (
				Object.prototype.hasOwnProperty.call(this.store, key) &&
				!isEqual(value, this.store[key])
			) {
				result[key] = newData[key];
			}
		}
		return result;
	}
}
