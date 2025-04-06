import _ from "lodash";

class ChangeTracker {
	store = {};

	track(object) {
		this.store = _.cloneDeep(object);
	}

	getChange(newData) {
		var result = {};
		for (const [key, value] of Object.entries(newData)) {
			if (this.store.hasOwnProperty(key) && !_.isEqual(value, this.store[key]))
				result[key] = newData[key];
		}
		return result;
	}
}

export const changeTracker = new ChangeTracker();
