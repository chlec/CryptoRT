//const { ticker } = require('./liveticker')
const rp = require('request-promise')
const Poloniex = require('poloniex.js')
const round = (num, n) => Math.round(num * Math.pow(10, n)) / Math.pow(10, n)
const getCookie = (raw, cookieName) => {
	if (raw.indexOf(cookieName) > -1) {
		return raw.split(cookieName + "=")[1].split(";")[0]
	} else {
		return 0
	}
}

module.exports = function(socket) {
	/***********
	MAIN PART
	***********/
	var cookies = socket.request.headers.cookie
	var poloniex = new Poloniex(getCookie(cookies, 'api'), getCookie(cookies, 'secret'))

	//socket.on('live', resp => ticker(socket, resp[0], resp[1]))

	socket.on('sell', currency => {
		sell(currency)
			.then(
				//success
				orderNumber => 	socket.emit("msg", `dsp("Order #${orderNumber} has been created.", "success")`),
				//error
				error =>		socket.emit("msg", `dsp("Error: #${error}", "error")`)
				
			)
	})
	
	socket.on('getBalances', () => {
		getBalances()
			.then(getTrades)
			.then(formatBalances)
			.then(balances => socket.emit('balances', balances))
	})

	socket.on('getCharts', arr => {
		var currency = arr[0]
		var boughtPrice = arr[1]
		var yesterday = Math.floor(Date.now() / 1000) - 3600 * 24, now = Math.floor(Date.now() / 1000)

		//get charts of last 24hours with 30 min candlesticks
		poloniex.returnChartData('BTC', currency, 1800, yesterday, now, (_, data) => {

			var chartValues = [], hoursList = [], i = 0

			for (val in data) {
				//date in format hh:mm
				var date = new Date(data[val].date * 1000).toTimeString().replace(/.*(\d{2}:\d{2})(:\d{2}).*/, "$1")

				//only put fix hours
				date.split(":")[1] == "00" ? hoursList.push(date) : hoursList.push("")
				chartValues.push(data[val].weightedAverage)

				if (++i == Object.keys(data).length)
					socket.emit('chart', [currency, chartValues, hoursList, boughtPrice])
			}
		})
	})
	/***********
	//MAIN PART
	***********/

	//sell a currency
	function sell(currency) {

		return new Promise(function(accept, reject) {

			poloniex.returnBalances((_, balances) => {

				poloniex.returnTicker((_, ticker) => {

					var currentRate = parseFloat(ticker[`BTC_${currency}`]['last'])
					var sellRate = currentRate * 1.005

					poloniex.sell('BTC', currency, sellRate, balances[currency], (err, data) => {
						if (err || data.error)
							reject(err || data.error)
						else
							accept(data.orderNumber)
					})

				})

			})

		})

	}

	//return all balances
	function getBalances() {

		return new Promise(function(accept) {

			poloniex.returnCompleteBalances((err, balances) => {

				if (err)
					throw err

				accept(balances)

			})
		})
	}

	// return all trades
	function getTrades(balances) {

		return new Promise(function(accept) {

			var data = {}
			var trades = {}

			for (var currency in balances) {
				balances[currency].available = parseFloat(balances[currency].available) + parseFloat(balances[currency].onOrders)

				if (parseFloat(balances[currency].available) > 0.1 && currency !== "BTC") {
					console.log(currency)
					data[currency] = balances[currency];

					(function ordersList(currency){

						poloniex.returnTradeHistory('BTC', currency, (err, list) => {

							if (err || list.error)
								return ordersList(currency)

							trades[currency] = list

							if (Object.keys(data).length == Object.keys(trades).length)
								accept({data: data, trades: trades})

						})

					})(currency)

				}
			}
		})
	}

	/*
	return array[ETH] = [amount of ETH, estimated BTC value, order rate, btc rate during the order]
	*/
	function formatBalances(array) {

		return new Promise(function(accept) {

			var trades = array.trades
			var balances = array.data
			var returnArray = {}

			for (var currency in trades) {

				for (var order of trades[currency]) {

					if (order.type == "buy") {

						btcValueByOrder(order, btcVal => {

							returnArray[currency] = [round(balances[currency].available, 2), parseFloat(balances[currency].btcValue), parseFloat(order.rate), btcVal]
							
							if (Object.keys(returnArray).length == Object.keys(balances).length) 
								accept(returnArray)
						})

						break
					}
				}
			}
		})
	}

	const btcValueByOrder = (order, callback) => {
		var orderDate = new Date(order.date).getTime() / 1000
		var nowTimestamp = Math.floor(new Date().getTime() / 1000)

		//if order was made during last 24
		if (nowTimestamp - orderDate < 3600 * 24)
			var API = `https://blockchain.info/ticker`
		else {
			var date = order.date.split(" ")[0]
			var API = `http://api.coindesk.com/v1/bpi/historical/close.json?start=${date}&end=${date}`
		}

		rp(API)
			.then(html => {
				html = JSON.parse(html)
				callback(
					html['bpi']
						? html['bpi'][Object.keys(html['bpi'])[0]]
						: html['USD']['15m']
				)
			})
			.catch(err => console.log(err))
	}
}