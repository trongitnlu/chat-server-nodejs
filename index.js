var express = require('express');
var app = express();

var server = require('http').Server(app);
var port = (process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 6969);
var io = require('socket.io')(server);
var userOnile = []
var userAwait = []
var maps = new Map()


server.listen(port, () => console.log('Server running in port ' + port));

io.on('connection', function (socket) {
	var room = null
	userOnile.push(socket.id)
	// console.log(socket.id + ': connected');
	console.log(userOnile);
	let color = random_bg_color()
	maps.set(socket.id, color)

	socket.emit('id', { user: socket.id, color: "#004085" });

	socket.on('thoat', data => {
		console.log(data)
		try{
			io.sockets.connected[data.guest].emit("thoat", true)
			io.sockets.connected[data.user].emit("thoat", true)
		}catch(e){
			console.log(`Bugs Thoat: ${e}`)
		}
	})

	socket.on('disconnect', function () {
		userOnile.remove(socket.id); //Xóa user online
		userAwait.remove(socket.id)  //Xóa user chờ kết nối
		maps.delete(socket.id) //xóa color trong map

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
			room = user2
			try {
				io.sockets.emit(user1, { myId: user1, guestId: user2, room: room })
				io.sockets.emit(user2, { myId: user2, guestId: user1, room: room })
			} catch (e) {
				console.log(e)

			}

		}

	})

	socket.on('newMessage', data => {
		var date = new Date()
		try {
			if (data.isGroup) {
				var dataSend = { data: data.message, id: socket.id, time: `${date.getHours()}:${date.getMinutes()}`, isGroup: true, color: maps.get(socket.id) }
				io.sockets.emit('newMessage', dataSend)
			}

		} catch (e) {
			console.log(e)
		}
	})

	socket.on('newMessageOneToOne', data => {
		var date = new Date()
		try {
			if (data.guest != null && data.isOneToOne) {
				var dataSend = { data: data.message, id: socket.id, time: `${date.getHours()}:${date.getMinutes()}`, isGroup: false }
				io.sockets.connected[data.user].emit("newMessage", { ...dataSend, color: maps.get(data.guest) })
				io.sockets.connected[data.guest].emit("newMessage", { ...dataSend, color: maps.get(data.user) })
			}
		} catch (e) {
			userOnile.remove(data.guest); //Xóa user online
			userAwait.remove(data.guest)  //Xóa user chờ kết nối
			maps.delete(data.guest) //xóa color trong map
			var idSocket = data.guest + "a"
			io.sockets.emit(idSocket, true)
			console.log(idSocket)
		}
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
getRandomColor = () => {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

random_bg_color = () => {
	var x = Math.floor(Math.random() * 256);
	var y = 100;
	var z = 88;
	var bgColor = "hsl(" + x + "," + y + "%," + z + "%)";
	return bgColor
}
