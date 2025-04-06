function debounce(fn: Function, ms: number) {
	let timer: number;

	return function () {
		// Nhận các đối số
		const args = arguments;
		const context = this;

		if (timer) clearTimeout(timer);

		timer = setTimeout(() => {
			fn.apply(context, args);
		}, ms);
	};
}

export { debounce };
