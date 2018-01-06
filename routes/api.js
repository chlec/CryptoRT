const express = require('express')
const router = express.Router()
const Polo = require('../lib/poloniex.api')
const Bittrex = require('../lib/bittrex.api')

router
	.get('/getBalances', (req, res) => {
		let cookies = req.cookies
		let API = cookies.provider === 'polo'
			? new Polo(cookies.api, cookies.secret)
			: new Bittrex(cookies.api, cookies.secret)

		API.checkApi(valid => {
			if (valid)
				API.getBalances()
					.then(b => API.getTrades(b))
					.then(arr => API.formatBalances(arr))
					.then(balances => res.json(balances))
			else
				res.json({error: true})
		})
	})

	.post('/getCharts', (req, res) => {
		let cookies = req.cookies
		let API = cookies.provider === 'polo'
			? new Polo(cookies.api, cookies.secret)
			: new Bittrex(cookies.api, cookies.secret)

		if (req.body.cur && req.body.price)
			API.getCharts([req.body.cur, req.body.price], data => {
				res.json(data)
			})
		else
			res.json({error: true})
	})

	.post('/sell', (req, res) => {
		let cookies = req.cookies
		let API = cookies.provider === 'polo'
			? new Polo(cookies.api, cookies.secret)
			: new Bittrex(cookies.api, cookies.secret)

		API.checkApi(valid => {
			if (valid)
				API.sell(req.body.currency)
					.then(
						orderNumber => 	res.json({order: orderNumber}),
						error =>		res.json({error: error})
					)
			else
				res.json({error: true})
		})
	})

module.exports = router
