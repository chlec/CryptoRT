const rp = require('request-promise')
const round = (num, n) => Math.round(num * Math.pow(10, n)) / Math.pow(10, n)

class Bittrex {
	constructor(api, secret) {
		this.bittrex = require('node.bittrex.api')
		this.bittrex.options({
			'apikey': api,
			'apisecret': secret
		})
	}
	checkApi(callback) {
		this.bittrex.getbalance({ currency: 'BTC' }, function(data, err) {
			callback(!err && data.success)
		})
	}
	sell(currency){

		return new Promise((accept, reject) => {

			var market = `BTC-${currency}`

			this.bittrex.getbalance({ currency: currency }, (balance, _) => {

				this.bittrex.getticker({ market: market }, (ticker, _) => {

					var currentRate = ticker.result.Last
					var sellRate = currentRate * 1.005

					this.bittrex.tradesell({
						MarketName: market,
						OrderType: 'LIMIT',
						Quantity: balance.result.Available,
						Rate: sellRate,
						TimeInEffect: 'GOOD_TIL_CANCELLED', // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
						ConditionType: 'NONE', // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
						Target: 0, // used in conjunction with ConditionType
					}, (data, err) => {
						if (err || !data.success)
							reject(err || !data.success)
						else
							accept(data.result.OrderId)
					})

				})

			})

		})
	}
	getBalances() {
		return new Promise((accept) => {
			//this vaut undefined quand on crée une promise
			var balanceLists = () => {
				this.bittrex.getbalances((balances, err) => {
					if (err) {
						return balanceLists()
					}
					accept(balances)
				})
			}
			balanceLists()
		})
	}
	getTrades(balances) {

		return new Promise((accept) => {

			var data = {}
			var trades = {}
			for (var d in balances.result) {
				var balance = parseFloat(balances.result[d].Balance)
				var currency = balances.result[d].Currency				

				if (balance > 0.1 && currency !== "BTC") {
					data[currency] = balance

					var ordersList = currency => {
						this.bittrex.getorderhistory({ market: 'BTC-' + currency }, (list, err) => {

							if (err || !list.success)
								return ordersList(currency)

							trades[currency] = list.result

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
		//return [AVAILABLE, CURRENT BTC VALUE OF ALL COIN, PRICE BOUGHT, CURRENT BTC PRICE]
		return new Promise((accept) => {

			var trades = array.trades
			var balances = array.data
			var returnArray = {}

			for (let currency in trades) {

				for (let order of trades[currency]) {

					if (order.OrderType.indexOf("BUY") > -1) {

						this.bittrex.getticker({ market: 'BTC-' + currency }, (ticker, err) => {

							this.btcValueByOrder(order)
								.then(btcVal => {
									returnArray[currency] = [
										round(balances[currency], 2),
										ticker.result.Last * balances[currency],
										parseFloat(order.PricePerUnit),
										btcVal
									]
								//	console.log(Object.keys(returnArray).length, Object.keys(balances).length)
								//	console.log(returnArray)
									if (Object.keys(returnArray).length === Object.keys(balances).length)
										accept(returnArray)
								},
								() => {
									returnArray[currency] = [
										round(balances[currency], 2),
										ticker.result.Last * round(balances[currency], 2),
										parseFloat(order.PricePerUnit),
										10000
									]
									if (Object.keys(returnArray).length === Object.keys(balances).length)
										accept(returnArray)
								})
						})
					}
				}
			}
		})
	}
	btcValueByOrder(order) {
		return new Promise((accept, reject) => {
			var orderDate = new Date(order.TimeStamp).getTime() / 1000
			var nowTimestamp = Math.floor(new Date().getTime() / 1000)

			//if order was made during last 24
			if (nowTimestamp - orderDate < 3600 * 24)
				var API = `https://blockchain.info/ticker`
			else {
				var date = order.TimeStamp.split("T")[0]
				var API = `http://api.coindesk.com/v1/bpi/historical/close.json?start=${date}&end=${date}`
			}

			rp(API)
				.then(html => {
					html = JSON.parse(html)
					accept(
						html['bpi']
							? html['bpi'][Object.keys(html['bpi'])[0]]
							: html['USD']['15m']
					)
				})
				.catch(err => reject(err))
		})
	}
	getCharts(arr, cb) {
		//return [currency, chartValues, hoursList, boughtPrice]
		var currency = arr[0]
		var boughtPrice = arr[1]

		//get charts of last 24hours with 30 min candlesticks
		this.bittrex.getcandles({
		  marketName: 'BTC-' + currency,
		  tickInterval: 'thirtyMin',
		}, async (data, err) => {
			if (err || !data.success)
				return

			var candles = await this.formatCandles(data.result, 48);

			var chartValues = []
			var hoursList = []
			var i = 0

			for (var val of candles) {
				//date in format hh:mm
				var date = val.T.replace(/.*(\d{2}:\d{2})(:\d{2}).*/, "$1")

				//only put fix hours
				date.split(":")[1] == "00" ? hoursList.push(date) : hoursList.push("")
				chartValues.push(val.L)

				if (++i == Object.keys(candles).length)
					cb([currency, chartValues, hoursList, boughtPrice])
			}
		})
	}
	formatCandles(data, n) {
		return new Promise(accept => {
			var len = data.length
			var arr = []
			var i = len - n
			var j = 0

			while (i < len) {
				arr[j++] = data[i++]
				if (i === len)
					accept(arr)
			}
		})
	}
}

module.exports = Bittrex
