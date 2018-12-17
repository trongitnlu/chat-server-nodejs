var express = require('express');
var app = express();

var server = require('http').Server(app);
var port = (process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 6969);
var io = require('socket.io')(server);
var userOnile = []
var userAwait = []
var maps = new Map()


var sql = require("mssql");

// config for your database
var config = {
	user: 'mekong',
	password: 'VaoDaTa@0908163436',
	server: 'nguyenbacsang.com',
	database: 'testthang'
};

sql.connect(config, function (err) {

	if (err) console.log(err);


})

// view engine setup
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')


server.listen(port, () => console.log('Server running in port ' + port));

const addressServer = server.address()

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
		try {
			io.sockets.connected[data.guest].emit("thoat", true)
			io.sockets.connected[data.user].emit("thoat", true)
		} catch (e) {
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
	res.render('index.ejs', { ip_current: JSON.stringify(addressServer) })
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

const data = [
	{ name: 'Page 1: Phân loại chi phí theo tài khoản', link: 'api/filter-chiphi-theotaikhoan?pageNumber=1&size=10', error: '{error:boolean, message:string}', method: 'GET', note: 'pageNumber: Số trang cần tới ; size:Số dòng cần lấy' },
	{ name: 'Page 2: CP NVL trực tiếp', link: 'api/cp-nvl', method: 'GET', error: '{error:boolean, message:string}' },
	{ name: 'Page 2: CP NC trực tiếp', link: 'api/cp-nc', method: 'GET', error: '{error:boolean, message:string}' },
	{ name: 'Page 2: CP SXC - 627', link: 'api/cp-sxc', method: 'GET', error: '{error:boolean, message:string}' },
	{ name: 'Page 3: Lấy ngày tháng năm', link: 'api/getngaythangnam', method: 'GET', error: '{error:boolean, message:string}' },
	{ name: 'Page 3: Lọc đối tượng tập hợp chi phí theo sản phẩm', link: 'api/filter-chiphi-theosanpham?tuky=201509&denky=201809', error: '{error:boolean, message:string}', method: 'GET', note: 'tuky, denky: Định dạng năm tháng' },



]
//Database
app.get('/api', (req, res) => {
	// res.render('index.ejs',{ ip_current: 'local_ip' })
	res.render('table.ejs', { page_title: 'API', data: data, url: addressServer.host })
})

//api CP NVL trực tiếp
app.get('/api/cp-nvl', (req, res) => {
	// create Request object
	var request = new sql.Request();

	// query to the database and get the records
	request.query("Select * From tb3008 Where ExpenseID = 'COST001'", function (err, recordset) {

		if (err) {
			console.log(err)
			res.send(new Status(true, err))
		} else {
			res.send(recordset.recordset);
		}

	})
})

//api CP NC trực tiếp
app.get('/api/cp-nc', (req, res) => {
	// create Request object
	var request = new sql.Request();

	// query to the database and get the records
	request.query("Select * From tb3008 Where ExpenseID = 'COST002'", function (err, recordset) {

		if (err) {
			console.log(err)
			res.send(new Status(true, err))
		} else {
			res.send(recordset.recordset);
		}

	})
})

//api CP SXC - 627
app.get('/api/cp-sxc', (req, res) => {
	// create Request object
	var request = new sql.Request();

	// query to the database and get the records
	request.query("Select * From tb3008 Where ExpenseID = 'COST003'", function (err, recordset) {

		if (err) {
			console.log(err)
			res.send(new Status(true, err))
		} else {
			res.send(recordset.recordset);
		}

	})
})

const DivisionID = 'HPCNB2015'

//3) Theo sản phẩm: 
app.get('/api/getngaythangnam', (req, res) => {
	// create Request object
	var request = new sql.Request();

	// query to the database and get the records
	request.query(`Select Distinct MonthYear , TranMonth , TranYear, DivisionID From vi0317 Where DivisionID ='${DivisionID}' ORDER BY TranYear DESC, TranMonth DESC`, function (err, recordset) {

		if (err) {
			console.log(err)
			res.send(new Status(true, err))
		} else {
			res.send(recordset.recordset);
		}

	})
})

//3) Đối tượng tập hợp chi phí - Theo sản phẩm:  
app.get('/api/filter-chiphi-theosanpham', (req, res) => {
	const tuky = req.query.tuky

	const denky = req.query.denky

	// create Request object
	var request = new sql.Request();


	// query to the database and get the records
	request.query(`Select *  From vi3013 Where not (((ToMonth+ToYear*100)<${tuky}) Or (${denky}<(FromMonth+FromYear*100)))  And IsForPeriodID = 0 Order by PeriodID `,
		function (err, recordset) {

			if (err) {
				console.log(err)
				res.send(new Status(true, err))
			} else {
				res.send(recordset.recordset);
			}

			// send records as a response

		})
})

//2) phân loại chi phí theo tài khoản:  
app.get('/api/filter-chiphi-theotaikhoan', (req, res) => {
	// create Request object
	const p_page_number = req.query.pageNumber
	const p_size = req.query.size

	const qy = "Select  tb3009.ExpenseID, tb3009.MaterialTypeID, UserName as MaterialTypeName,tb3009.AccountID , ExpenseName From tb3009 Left Join tb3008  On tb3008.MaterialTypeID = tb3009.MaterialTypeID Inner join tb3030 on    tb3030.ExpenseID = tb3009.ExpenseID  left join tb0025 on tb0025.AccountID = tb3009.AccountID Where tb0025.IsNotShow = 0"
	var request = new sql.Request();
	request.input('p_page_number', sql.Int, p_page_number)
	request.input('p_size', sql.Int, p_size)
	request.input('sql_query', sql.NVarChar, qy)
	request.output('p_sum_page', sql.Int)
	request.output('p_sum_records', sql.Int)


	request.execute('proc_paging_query', (err, result) => {
		if (err) {
			console.log(err)
			res.send(new Status(true, err))
		} else {
			console.log(result.recordsets.length) // count of recordsets returned by the procedure
			console.log(result.recordsets[0].length) // count of rows contained in first recordset
			console.log(result.recordset) // first recordset from result.recordsets
			console.log(result.returnValue) // procedure return value
			console.log(result.output) // key/value collection of output values
			console.log(result.rowsAffected) // array of
			res.send({ 'data': result.recordset, ...result.output })
		}
	})

})

class Status {
	constructor(error, message) {
		this.error = error
		this.message = message
	}
}