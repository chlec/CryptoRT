const ticker = require('./liveticker')

module.exports = function(socket) {
	setInterval(function() {
		ticker(15)
			.then(
				datas => socket.emit('live', datas),
				err => console.log(err)
			)
	}, 10000)
}