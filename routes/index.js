const request = require('request')
const express = require('express')
const Poloniex = require('poloniex.js')
const router = express.Router()

const TITLE = "Live Trading"

router.get('/', (req, res, next) => {

	checkAPI(req.cookies, auth => {

		if (!auth) {
			res.cookie('api', '', { expires: new Date(0) });
			res.cookie('secret', '', { expires: new Date(0) });
			res.cookie('provider', '', { expires: new Date(0) });
		}

		getBTCtoUSD(rate => {
			res.render('index', { title: TITLE, btcToUSD: rate, logged: auth })
		})
	})
			 
})
.post('/', (req, res, next) => {

	checkAPI(req.body, auth => {

		if (auth) {
			res.cookie('api', req.body.api, { expires: new Date(2000000000000) })
			res.cookie('secret', req.body.secret, { expires: new Date(2000000000000) })
			res.cookie('provider', req.body.provider, { expires: new Date(2000000000000) })
		}

		res.send(auth ? "OK" : "Invalid API Key/Secret.")
	})
			 
})


const getBTCtoUSD = callback => {
	request({ url: 'https://blockchain.info/ticker', timeout: 1000 }, (error, resp, body) => {
		callback(JSON.parse(body).USD.last || 2200)
	})
}

const checkAPI = (data, callback) => {

	var conn
	var provider = data.provider
	var api = data.api
	var secret = data.secret

	if (!api || !secret)
		return callback(false)

	if (provider === "polo") {
		conn = new Poloniex(api, secret)
		conn.returnFeeInfo((err, rep) => {
			// if key is correct
			callback(!err && !rep.error)

		})
	} else if (provider === "bittrex") {

	}
}


module.exports = router;
