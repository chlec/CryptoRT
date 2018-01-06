/*
socket.on('live', resp => ticker(socket, resp[0], resp[1]))
Ticker live before. Need to fix this

ACTUALLY DOESN'T WORK. Maybe I'll update this later to get the current ticker of a coin.
*/

const ticker = require('./liveticker')

module.exports = function(socket) {
	socket.on('live', () => {
		ticker(15)
			.then(
				datas => socket.emit('live', datas),
				err => console.log(err)
			)
	})
}