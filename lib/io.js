const { ticker } = require('./liveticker')
const getCookie = (raw, cookieName) => {
	if (raw.indexOf(cookieName) > -1) {
		return raw.split(cookieName + "=")[1].split(";")[0]
	} else {
		return 0
	}
}

/*
socket.on('live', resp => ticker(socket, resp[0], resp[1]))
Ticker live before. Need to fix this

ACTUALLY DOESN'T WORK. Maybe I'll update this later to get the current ticker of a coin.
*/

module.exports = function(socket) {
	socket.on('live', resp => ticker(socket, resp[0], resp[1]))
}