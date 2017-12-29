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

	var API;
	var cookies = socket.request.headers.cookie
	var provider = getCookie(cookies, 'provider')

	switch (provider) {
		case 'POLO':
			API = new Polo(getCookie(cookies, 'api'), getCookie(cookies, 'secret'))
		case 'BITTREX':
			API = new Bittrex(getCookie(cookies, 'api'), getCookie(cookies, 'secret'))
	}

	if (API) {
		socket.on('sell', currency => {
			API.sell(currency)
				.then(
					//success
					orderNumber => 	socket.emit("msg", `dsp("Order #${orderNumber} has been created.", "success")`),
					//error
					error =>		socket.emit("msg", `dsp("Error: #${error}", "error")`)
					
				)
		})
		
		socket.on('getBalances', () => {
			API.getBalances()
				.then(API.getTrades)
				.then(API.formatBalances)
				.then(balances => socket.emit('balances', balances))
		})

		socket.on('getCharts', arr => 
			API.getCharts(arr, val =>
				socket.emit('chart', val)))
	}
}