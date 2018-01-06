/*
* all lib functions
*/
const
	getRandomColor = () => {
	    var letters = '0123456789ABCDEF'
	    var color = '#'
	    for (var i = 0; i < 6; i++ )
	        color += letters[Math.floor(Math.random() * 16)]
	    return color;
	},

	round = (num, n) => Math.round(num * Math.pow(10, n)) / Math.pow(10, n),

	c = {
		green: t => `<font color="#197D00">${t}</font>`,
		red: t => `<font color="#AF0000">${t}</font>`,
	},

	totalCostEstimed = (data, callback) => {
		//data contains all currency infos
		var estim = 0,
			cost = 0,
			i = 0
		for (let cur in data) {
			estim += btcToUSD * data[cur][1]
			cost += data[cur][3] * (data[cur][2] * data[cur][0])
			if (++i == Object.keys(data).length)
				callback(round(estim, 2), round(cost, 2))
		}
	},

	dsp = (msg, type) => {
		if(type != "success") type = "danger"
		document.getElementById("modal-text").innerHTML = msg
		document.getElementById("close-modal").className = "btn btn-"+type
		$('#important-msg').modal()  
	}

/*
* sio handle functions
*/

var LISTEN_TICKER = false

const balances = data => {
	console.log(data)
	resetDatas()
		.then(_ => {
			var table = document.getElementById("stockTable")
			for (var cur in data) {

				let row = table.insertRow(-1),
					currency = row.insertCell(0),
					amount = row.insertCell(1),
					purchaseCost = row.insertCell(2),
					evolutionUSD = row.insertCell(3),
					evolutionBTC = row.insertCell(4),
					action = row.insertCell(5)

				let cost = round(data[cur][3] * (data[cur][2] * data[cur][0]), 2),
					estimatedPrice = round(btcToUSD * data[cur][1], 2),
					variationUSD = round((estimatedPrice - cost) / cost * 100, 2),
					costBTC = data[cur][2] * data[cur][0],
					variationBTC = round((data[cur][1] - costBTC) / costBTC * 100, 2)

				currency.innerHTML = cur
				amount.innerHTML = data[cur][0]
				purchaseCost.innerHTML = "$" + cost
				evolutionUSD.innerHTML = variationUSD > 0 ? c.green(variationUSD + "%") : c.red(variationUSD + "%")
				evolutionBTC.innerHTML = variationBTC > 0 ? c.green(variationBTC + "%") : c.red(variationBTC + "%")
				action.innerHTML = `<button type="button" class="submit" style="margin-top: 0" onclick="sell('${cur}')">Sell</button>`

				//check if chart exist, if not we request one
				if ($('#'+cur).length == 0)
					$.post('/api/getCharts', { cur: cur, price: data[cur][2]}, chart)

				//write total
				if ($("#stockTable tr").length == Object.keys(data).length + 1) {
					var total = document.getElementById("total"),
						entre = total.insertRow(-1),
						c1 = entre.insertCell(0),
						c2 = entre.insertCell(1),
						c3 = entre.insertCell(2)
						totalCostEstimed(data, (estimated, cost) => {
							c1.innerHTML = "$" + cost
							c2.innerHTML = "$" + estimated
							let totalVariation = round((estimated - cost) / cost * 100, 2)
							c3.innerHTML = totalVariation > 0 ? c.green(totalVariation + "%") : c.red(totalVariation + "%")
						})

					if (!LISTEN_TICKER) {
						//socket.emit("live", [cur, data[cur]])
						LISTEN_TICKER = true
					}
				}
			}
		})
}

function sell(currency) {
	if (confirm(`Do you wanna sell all your ${currency}?`))
		$.post('/api/sell', { currency: currency }, res => {
			if (res.error)
				dsp(`Error: #${res.error}`, "error")
			else
				dsp(`Order #${res.order} has been created.`, "success")
		})
}

const chart = rep => {
	var	currency = rep[0],
		raw = rep[1],
		hoursList = rep[2],
		boughtPrice = rep[3]
	$("#charts").append('<canvas class="box" id="' + currency + '" width="400" height="300"></canvas>')
	var ctx = document.getElementById(currency)
	var newChart = new Chart(ctx, {
	    type: 'line',
	    data: {
	        labels: hoursList,
	        datasets: [{
	            label: currency + ' during last 24 hours (bought at ' + boughtPrice + ' BTC)',
	            data: raw,
	            borderColor: [
	                getRandomColor()
	            ],
	            borderWidth: 1
	        }]
	    }
	})
	//5 minutes -> 1000 * 60 * 5
	setTimeout(() => {
		$('#'+currency).remove()
		$.post('/api/getCharts', { cur: currency, price: boughtPrice}, chart)
	}, 1000 * 60 * 5)
}

function chartsRotation() {
	//rotate when we have 2 charts
	var charts = $("canvas")
	if (charts.length > 1) {
		charts.each((i, element) => {
			let cur = element.id,
				e = $("#"+cur)

			if (e.is(":visible")) {
				e.fadeOut(() => {
					if (charts[i+1] != undefined) {
						charts[i+1].style.display = "block"
					} else {
						charts[0].style.display = "block"
					}
				})
				return false
			}
		})
	}
}

function resetDatas() {
	return new Promise(accept => {
		var total = $("#total tr")[1]
		if (total) total.remove()

		$("#stockTable tr").each((i, e) => {
			if (i > 0) e.remove()
			if($("#stockTable tr").length == 1)
				accept()
		})
	})
}

$(document).ready(() => {

	$.get('/api/getBalances', balances)
	setInterval(() => $.get('/api/getBalances', balances), 10000)
	setInterval(() => chartsRotation(), 10000)
	setTimeout(() => location.reload(), 30 * 60 * 1000) //refresh page in 30 min to get new btc price

	$("#logout").on("click", () => {

		var cookies = document.cookie.split(";")

	    for (var i = 0; i < cookies.length; i++) {
	        var cookie = cookies[i]
	        var eqPos = cookie.indexOf("=")
	        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
	        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT"
	    }
	    location.reload()
	})
})