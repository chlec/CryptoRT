//const { ticker } = require('./liveticker')
const Polo = require('./poloniex.api')
const Bittrex = require('./bittrex.api')
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
*/

module.exports = function(socket) {

	var API
	var cookies = socket.request.headers.cookie
	var provider = getCookie(cookies, 'provider')

	switch (provider) {
		case 'polo':
			API = new Polo(getCookie(cookies, 'api'), getCookie(cookies, 'secret'))
			break
		case 'bittrex':
			API = new Bittrex(getCookie(cookies, 'api'), getCookie(cookies, 'secret'))
			break
	}

	if (API) {

		socket.on('sell', currency => {
			API.sell(currency)
				.then(
					orderNumber => 	socket.emit("msg", `dsp("Order #${orderNumber} has been created.", "success")`),
					error =>		socket.emit("msg", `dsp("Error: #${error}", "error")`)
				)
		})
		
		socket.on('getBalances', () => {
			API.getBalances()
				.then(b => API.getTrades(b))
				.then(arr => API.formatBalances(arr))
				.then(balances => socket.emit('balances', balances))
		})

		socket.on('getCharts', arr => 
			API.getCharts(arr, val =>
				socket.emit('chart', val)))
	}
}