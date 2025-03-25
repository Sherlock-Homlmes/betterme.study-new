<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import { usePomodoroStore } from "~~/stores/pomodoros";

const { timerString, currentScheduleColour } = usePomodoroStore();

onMounted(async () => {
	// auto PIP mode
	const videoPlayer = document.getElementById("videoPlayer");
	const source = document.createElement("canvas");
	const ctx = source.getContext("2d");
	ctx.font = "900 50px Arial";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	const { resume } = useIntervalFn(() => {
		ctx.fillStyle = `${currentScheduleColour.value}`;
		ctx.fillRect(0, 0, source.width, source.height);
		ctx.fillStyle = "black";
		ctx.fillText(timerString.value, source.width / 2, source.height / 2);
		requestAnimationFrame(resume);
	}, 1000);

	const stream = source.captureStream();
	videoPlayer.srcObject = stream;

	const enablePipMode = async () => {
		videoPlayer.style.display = "block";
		if (document.pictureInPictureEnabled) {
			videoPlayer.play();
			await videoPlayer.requestPictureInPicture();
		}
	};
	const disablePipMode = async () => {
		videoPlayer.style.display = "none";
		if (document.pictureInPictureElement) {
			videoPlayer.pause();
			await document.exitPictureInPicture();
		}
	};
	// Event listener to auto enable pip mode when user leave page
	useEventListener("focus", disablePipMode);
	useEventListener("blur", enablePipMode);

	resume();
});
</script>

<template>
    <video id="videoPlayer" width="1920" height="1080" style="display: none" autoplay>
      <source src="" type="video/mp4">
      Your browser does not support the video tag.
    </video>
</template>
