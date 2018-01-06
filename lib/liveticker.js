const bittrex = require('node.bittrex.api')
const round = (num, n) => Math.round(num * Math.pow(10, n)) / Math.pow(10, n)

/* 
 *	This function return an array for each coins formatted like this:
 *  - Short name, Volume, 24% change
 */
function marketSort(data, n, fn) {
	var out = {}

	var getHighestVolume = (data, cb) => {
		var best = {
			coin: 'BTC',
			value: 0
		}
		var i = 0

		for (let coin in data) {
			let market = data[coin]

			if (market[0] > best.value) {
				best.coin = coin
				best.value = market[0]
			}
			i++
			if (i === Object.keys(data).length)
				cb(best.coin)
		}
	}

	for (var i = 1; i <= n; i++)
		getHighestVolume(data, coin => {
			out[coin] = data[coin]
			delete data[coin]
			if (i === n)
				fn(out)
		})
}

module.exports = (n) => {
	return new Promise((accept, reject) => {

		const datas = {}

		bittrex.getmarketsummaries((rep, err) => {
			if (err) {
				reject(err)
				return
			}
			for (var i in rep.result) {
				let market = rep.result[i]
				let coins = market.MarketName.split('-')

				if (coins[0] === 'BTC') {
					coin = coins[1]
					datas[coin] = [
						market.Volume * ((market.PrevDay + market.Last) / 2),
						round((market.Last - market.PrevDay) / market.PrevDay * 100, 2)
					]
				}
				if (i == rep.result.length - 1) {
					marketSort(datas, n, accept)
				}
			}
		})
	})
}