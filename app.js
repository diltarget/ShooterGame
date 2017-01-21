var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(8000);

function handler (req, res) {
	console.log(req.url);
  fs.readFile(__dirname + req.url,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading '+req.url);
    }

    res.writeHead(200);
    res.end(data);
  });
}
var players = {};
var conn = {};
io.on('connection', function (socket) {
	
	players[socket.id] = {
		id:socket.id,
		x:23.5,
		y:23.5,
		angle:0,
		shooting:false,
		penalty:0
	}
	conn[socket.id] = socket;
	setInterval(function(){
		var loc = Object.assign({},players);
		delete loc[socket.id];
		socket.volatile.emit('objectdata', loc);
	},100);
	socket.on('update', function (data) {
		//console.log(players);
		for(var p in data){
			players[socket.id][p] = data[p];
		} 
	});
  
	socket.on('disconnect', function () {
		delete players[socket.id]
	});
  
});

setInterval(function(){
	for(var p in players){
		players[p].penalty--;
		if(players[p].penalty >= 0) continue
		if(!players[p].shooting) continue
		players[p].penalty = 0
		var hits;
		var distance; 
		for(var t in players){
			if(t === p) continue
			var dx = players[p].x-players[t].x;
			var dy = players[p].y-players[t].y;
			var theta = players[p].angle + (Math.pow(Math.random()-0.5,3)*Math.PI*2);
			//console.log(players[p].angle);
			//console.log(theta);
			var a = 2*((dx*Math.cos(theta))+(dy*Math.sin(theta)));
			var b = 4*((dx*dx)+(dy*dy)-(1/16));
			var c = (a*a)-b;
			if(c >= 0){
				c=Math.sqrt(c);
				if((-a+c)/2 > 0){
					if(!distance || Math.sqrt((dx*dx)+(dy*dy)) < distance){
						hits = t;
						distance = Math.sqrt((dx*dx)+(dy*dy))
					}
				}
			}
		}
		//console.log(-Math.log(1-Math.random())*10/distance)
		if(hits && -Math.log(1-Math.random())*10/distance > 1){
			console.log(p,"hits",t);
			conn[hits].emit("events",["dead"]);
			
		}else if(!hits){
			players[p].penalty += Math.ceil(-Math.log(1-Math.random())*10);
			console.log(p,"gets penalty",players[p].penalty);
		}else{
			console.log(p,"misses",t);
		}
	}
},100);
