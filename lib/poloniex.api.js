const Poloniex = require('poloniex.js')
const rp = require('request-promise')
const round = (num, n) => Math.round(num * Math.pow(10, n)) / Math.pow(10, n)

class Polo {
	constructor(api, secret) {
		this.poloniex = new Poloniex(api, secret)
	}
	checkApi(callback) {
		this.poloniex.returnFeeInfo((err, rep) => {
			callback(!err && !rep.error)
		})
	}
	sell(currency) {

		return new Promise((accept, reject) => {

			this.poloniex.returnBalances((_, balances) => {

				this.poloniex.returnTicker((_, ticker) => {

					var currentRate = parseFloat(ticker[`BTC_${currency}`]['last'])
					var sellRate = currentRate * 1.005

					this.poloniex.sell('BTC', currency, sellRate, balances[currency], (err, data) => {
						if (err || data.error)
							reject(err || data.error)
						else
							accept(data.orderNumber)
					})

				})

			})

		})
	}
	getBalances() {

		return new Promise((accept) => {

			this.poloniex.returnCompleteBalances((err, balances) => {

				if (err)
					throw err

				accept(balances)

			})
		})
	}
	getTrades(balances) {

		return new Promise((accept) => {

			var data = {}
			var trades = {}

			for (var currency in balances) {
				balances[currency].available = parseFloat(balances[currency].available) + parseFloat(balances[currency].onOrders)

				if (parseFloat(balances[currency].available) > 0 && currency !== "BTC") {
					data[currency] = balances[currency]

					var ordersList = currency => {

						this.poloniex.returnTradeHistory('BTC', currency, (err, list) => {

							if (err || list.error)
								return ordersList(currency)

							trades[currency] = list

							if (Object.keys(data).length == Object.keys(trades).length)
								accept({data: data, trades: trades})

						})

					}
					ordersList(currency)

				}
			}
		})
	}
	formatBalances(array) {
		return new Promise((accept) => {

			var trades = array.trades
			var balances = array.data
			var returnArray = {}

			for (var currency in trades) {

				for (var order of trades[currency]) {

					if (order.type == "buy") {

						this.btcValueByOrder(order, btcVal => {

							returnArray[currency] = [
								round(balances[currency].available, 2),
								parseFloat(balances[currency].btcValue),
								parseFloat(order.rate),
								btcVal
							]
							
							if (Object.keys(returnArray).length == Object.keys(balances).length) 
								accept(returnArray)
						})

						break
					}
				}
			}
		})
	}
	getCharts(arr, cb) {
		var currency = arr[0]
		var boughtPrice = arr[1]
		var yesterday = Math.floor(Date.now() / 1000) - 3600 * 24
		var now = Math.floor(Date.now() / 1000)

		//get charts of last 24hours with 30 min candlesticks
		this.poloniex.returnChartData('BTC', currency, 1800, yesterday, now, (_, data) => {

			var chartValues = []
			var hoursList = []
			var i = 0

			for (var val in data) {
				//date in format hh:mm
				var date = new Date(data[val].date * 1000).toTimeString().replace(/.*(\d{2}:\d{2})(:\d{2}).*/, "$1")

				//only put fix hours
				date.split(":")[1] == "00" ? hoursList.push(date) : hoursList.push("")
				chartValues.push(data[val].weightedAverage)

				if (++i == Object.keys(data).length)
					cb([currency, chartValues, hoursList, boughtPrice])
			}
		})
	}
	btcValueByOrder(order, callback) {
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

module.exports = Polo