const http = require('http')
const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

const app = express();

const server = http.createServer(app)

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hjs')
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser("zVQSQ2Gv"))
app.use(express.static(path.join(__dirname, 'public')))
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

const routes = {
	index: require('./routes/index'),
	api: require('./routes/api')
}

//API BELOW
app.use('/', routes.index)
app.use('/api', routes.api)

app.use(function(err, req, res, next) {
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  res.status(err.status || 500)
  res.render('error')
})

/*
	Ticker below, to have top 15 coins during last 24 hours
*/
const iohandle = require('./lib/io')
const io = require('socket.io').listen(server)
io.on('connection', iohandle)

server.listen(3000, function() {
	console.log("Server listening on port 3000")
})

module.exports = app
