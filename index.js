var socket = io()
const video = document.getElementById('video')
let isPlaying = false
let lastTimestamp = 0
const latencyThreshold = 500 // Adjust this value based on your network conditions

socket.on('play', timestamp => {
	if (!isPlaying) {
		const serverTime = Date.now()
		const latency = serverTime - timestamp

		if (Math.abs(latency) > latencyThreshold) {
			// If the latency is significant, adjust the video's current time
			const currentTime = video.currentTime + latency / 1000
			video.currentTime = currentTime
		}

		video.play().catch(error => console.error('Video play error:', error))
		isPlaying = true
	}
})

socket.on('pause', timestamp => {
	if (isPlaying) {
		const serverTime = Date.now()
		const latency = serverTime - timestamp

		if (Math.abs(latency) > latencyThreshold) {
			// If the latency is significant, adjust the video's current time
			const currentTime = video.currentTime + latency / 1000
			video.currentTime = currentTime
		}

		video.pause()
		isPlaying = false
	}
})

// Send play/pause events along with the current timestamp to the server
function emitPlayEvent() {
	const timestamp = Date.now()
	socket.emit('play', timestamp)
}

function emitPauseEvent() {
	const timestamp = Date.now()
	socket.emit('pause', timestamp)
}

// Handle user interaction (play/pause) and emit corresponding events
video.addEventListener('play', emitPlayEvent)
video.addEventListener('pause', emitPauseEvent)