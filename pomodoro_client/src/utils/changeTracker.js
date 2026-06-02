import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";

class ChangeTracker {
	store = {};

	track(object) {
		this.store = cloneDeep(object);
	}

	getChange(newData) {
		var result = {};
		for (const [key, value] of Object.entries(newData)) {
			if (this.store.hasOwnProperty(key) && !isEqual(value, this.store[key]))
				result[key] = newData[key];
		}
		return result;
	}
}

export default ChangeTracker;
