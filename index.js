var express = require('express');
var app = express();

var server = require('http').Server(app);
var port = (process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 6969);
var io = require('socket.io')(server);
var userOnile = []
var userAwait = []

server.listen(port, () => console.log('Server running in port ' + port));

io.on('connection', function (socket) {
	userOnile.push(socket.id)
	console.log(socket.id + ': connected');
	console.log(userOnile);
	socket.emit('id', socket.id);

	socket.on('disconnect', function () {
		userOnile.remove(socket.id);
		userAwait.remove(socket.id)
		console.log(socket.id + ': disconnected')
		var idSocket = socket.id + "a"
		io.sockets.emit(idSocket, true)
		console.log(idSocket)
	})

	socket.on('ketnoi', data => {
		var user1 = data.user
		userAwait.remove(user1)
		userAwait.push(user1)
		console.log(userAwait)
		var user2 = getRandomUser(user1, userAwait)
		if (user2 == null) {
			console.log("abc null ")
		} else {
			var room = user2
			try{
				io.sockets.emit(user1, { myId: user1, guestId: user2, room: room })
				io.sockets.emit(user2, { myId: user2, guestId: user1, room: room })
			}catch(e){
				console.log(e)

			}
			
		}

	})

	socket.on('newMessage', data => {
		var date = new Date()
		console.log(data);
		if (data.guest != null && data.isOneToOne) {
			io.sockets.connected[data.user].emit("newMessage", { data: data.message, id: socket.id, time: `${date.getHours()}:${date.getMinutes()}` })
			io.sockets.connected[data.guest].emit("newMessage", { data: data.message, id: socket.id, time: `${date.getHours()}:${date.getMinutes()}` })
		} else {
			io.sockets.emit('newMessage', { data: data.message, id: socket.id, time: `${date.getHours()}:${date.getMinutes()}`, isGroup: true });
		}

		//io.clients[sessionID].send()
		console.log(data);
	})

});

app.get('/', (req, res) => {
	res.send("Home page. Server running okay.");
})

Array.prototype.remove = function () {
	var what, a = arguments, L = a.length, ax;
	while (L && this.length) {
		what = a[--L];
		while ((ax = this.indexOf(what)) !== -1) {
			this.splice(ax, 1);
		}
	}
	return this
}

getRandomUser = (user, items) => {
	var item = items[Math.floor(Math.random() * items.length)];
	if (items.length <= 1) {
		return null
	}

	if (item == user) {
		return getRandomUser(user, items)
	} else {
		items.remove(item)
		items.remove(user)
		return item
	}
}