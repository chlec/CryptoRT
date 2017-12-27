var autobahn = require('autobahn')
var wsuri = "wss://api.poloniex.com"
var connection = new autobahn.Connection({
  url: wsuri,
  realm: "realm1"
})

connection.onclose = () => console.log('connection closed.')

module.exports = {

	ticker: (socket, currency, data) => {

		datas = {}

		connection.onopen = session => {

			console.log('connection opened.')

			session.subscribe('ticker', resp => {

				if (resp[0] === `BTC_${currency}`) {

					console.log('ticker updated')
					var last = parseFloat(resp[1])
					data[1] = last * data[0] //update btc val
					datas[currency] = data
					socket.emit('balances', datas)
					
				}

			})

		}

		if(!connection._connect_successes)
			connection.open()

	}
}