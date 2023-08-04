var socket = io()

const video = document.getElementById('video')
let isPlaying = false
let lastTimestamp = 0
const latencyThreshold = 350 // Adjust this value based on your network conditions

// Function to handle the submission of the movie URL and user-uploaded captions
function submitMovieUrl() {
	const videoUrlInput = document.getElementById('videoUrlInput')
	const videoUrl = videoUrlInput.value

	const captionsFileInput = document.getElementById('captionsFileInput')
	const captionsFile = captionsFileInput.files[0]
	const reader = new FileReader()

	// Read the user-uploaded captions file as text
	reader.readAsText(captionsFile)
	reader.onload = function () {
		const captionsText = reader.result
		const data = {
			videoUrl: videoUrl,
			captionsText: captionsText,
		}
		socket.emit('shareMovieData', data) // Send the video URL and captions text to the server
	}
}

// When the server broadcasts the shared video data, update the video and captions sources dynamically
socket.on('sharedMovieData', data => {
	const video = document.getElementById('video')
	video.src = data.videoUrl

	// Remove any existing text tracks (captions) from the video
	while (video.textTracks.length > 0) {
		video.textTracks[0].mode = 'disabled'
		video.textTracks[0].removeCue(video.textTracks[0].cues[0])
	}

	// Create a new text track for captions and add cues from the shared captions text
	const captionsTrack = video.addTextTrack('subtitles', 'English', 'en')
	captionsTrack.mode = 'showing'

	const parser = new WebVTT.Parser(window, WebVTT.StringDecoder())
	parser.oncue = function (cue) {
		captionsTrack.addCue(cue)
	}
	parser.parse(data.captionsText)
	parser.flush()
})

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

// Additional code to handle the captions load
function onCaptionsLoad() {
	const video = document.getElementById('video')
	const textTracks = video.textTracks

	// Find the track with the 'subtitles' kind (captions)
	let captionsTrack
	for (let i = 0; i < textTracks.length; i++) {
		if (textTracks[i].kind === 'subtitles') {
			captionsTrack = textTracks[i]
			break
		}
	}

	if (!captionsTrack) {
		console.error('Captions track not found.')
		return
	}

	// Display the captions by enabling the track
	captionsTrack.mode = 'showing'
}

// Call the captions load function on loadedmetadata event
video.addEventListener('loadedmetadata', onCaptionsLoad)
