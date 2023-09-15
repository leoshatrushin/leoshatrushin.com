const express = require('express');
const server = require('http').createServer();
const app = express();

app.get('/', function respond(req, res) {
	res.sendFile('index.html', {root: __dirname});
})

server.on('request', app);
server.listen(3000, function listen() {
	console.log('server started on port 3000');
});

/* begin websocket */

const WebSocketServer = require('ws').Server;

const wss = new WebSocketServer({server: server});

process.on('SIGINT', () => {
	wss.clients.forEach(function closeSocket(client) {
		client.close();
	});
	server.close(() => {
		shutDownDB();
	});
});

wss.on('connection', function connection(ws) {
	const numClients = wss.clients.size;
	console.log('Clients connected', numClients);

	wss.broadcast(`Current visitors: ${numClients}`);

	if (ws.readyState === ws.OPEN) {
		ws.send('Welcome to my server');
	}

	db.run(`INSERT INTO visitors (count, time)
		VALUES (${numClients}, datetime('now'))
	`);

	ws.on('close', function close() {
		wss.broadcast(`Current visitors: ${numClients}`);
		console.log('A client has disconnected');
	})
})

wss.broadcast = function broadcast(data) {
	wss.clients.forEach(function sendData(client) {
		client.send(data);
	});
};

/* end websocket */
/* begin database */
const sqlite = require('sqlite3');
const db = new sqlite.Database(':memory:');

db.serialize(function setupTables() {
	db.run(`
		CREATE TABLE visitors (
			count INTEGER,
			time TEXT
		)
	`)
});

function getCounts() {
	db.each("SELECT * FROM visitors", function logRow(err, row) {
		console.log(row);
	})
}

function shutDownDB() {
	console.log("Shutting down db");
	getCounts();
	db.close();
}
