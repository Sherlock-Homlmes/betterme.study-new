/**
 * Timer presets for quick setting of work, pause and long pause session lengths, and long pause intervals.
 * When updating these, make sure to also update their translations keys (`timerpreset`)
 */
export default {
	default: {
		pomodoro_study_time: 25 * 60, // 25 minutes
		pomodoro_rest_time: 5 * 60, // 5 minutes
		pomodoro_long_rest_time: 15 * 60, // 15 minutes
		long_rest_time_interval: 3,
	},
	easy: {
		pomodoro_study_time: 15 * 60, // 15 minutes
		pomodoro_rest_time: 5 * 60, // 5 minutes
		pomodoro_long_rest_time: 15 * 60, // 15 minutes
		long_rest_time_interval: 3,
	},
	advanced: {
		pomodoro_study_time: 40 * 60, // 15 minutes
		pomodoro_rest_time: 10 * 60, // 5 minutes
		pomodoro_long_rest_time: 30 * 60, // 15 minutes
		long_rest_time_interval: 3,
	},
	workaholic: {
		pomodoro_study_time: 50 * 60, // 15 minutes
		pomodoro_rest_time: 10 * 60, // 5 minutes
		pomodoro_long_rest_time: 30 * 60, // 15 minutes
		long_rest_time_interval: 3,
	},
};
