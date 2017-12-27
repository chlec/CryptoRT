const request = require('request')
const express = require('express')
const Poloniex = require('poloniex.js')
const router = express.Router()

const TITLE = "Live Trading"

router.get('/', (req, res, next) => {

	checkPoloAPI(req.cookies, auth => {

		if (!auth) {
			res.cookie('api', '', { expires: new Date(0) });
			res.cookie('secret', '', { expires: new Date(0) });
		}

		getBTCtoUSD(rate => {
			res.render('index', { title: TITLE, btcToUSD: rate, logged: auth })
		})
	})
			 
})
.post('/', (req, res, next) => {

	checkPoloAPI(req.body, auth => {

		if (auth) {
			res.cookie('api', req.body.api, { expires: new Date(2000000000000) })
			res.cookie('secret', req.body.secret, { expires: new Date(2000000000000) })
		}

		res.send(auth ? "OK" : "Invalid API Key/Secret.")
	})
			 
})


const getBTCtoUSD = callback => {
	request({ url: 'https://blockchain.info/ticker', timeout: 1000 }, (error, resp, body) => {
		callback(JSON.parse(body).USD.last || 2200)
	})
}

const checkPoloAPI = (data, callback) => {

	var api = data.api
	var secret = data.secret

	if (!api || !secret)
		return callback(false)

	var conn = new Poloniex(api, secret)
	conn.returnFeeInfo((err, rep) => {
		// if key is correct
		callback(!err && !rep.error)

	})

}


module.exports = router;
