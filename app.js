var config = require('./config');
var azure = require('azure');
var util = require('util');
var WebSocket = require('ws');
var WebSocketServer = require('ws').Server;
var http = require('http');
var express = require('express');



var app = express();
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
//server.listen(process.env.PORT);
server.listen(9999);

var msg = [];
var allSocks = [];
var connectionIDCounter = 0;

var wsSrc = new WebSocket(config.sourceSocket);
wsSrc.on('open', function() {
    console.log('Connected to: ' + config.sourceSocket);
});

wsSrc.on('message', function(data, flags) {
  var message = new Buffer(data).toString('base64');
  msg.push(message);
  console.log("message received. Msg length: " + msg.length);
});

wsSrc.on('close', function(ws) {
    console.log('Disconnected from: ' + config.sourceSocket);

    // try to reconnect
    //setTimeout(wsStart(), 5000);
});

var wsDst = new WebSocketServer({server: server});

wsDst.on('connection', function(ws) {
  //allSocks.push(ws);
  allSocks[connectionIDCounter++] = ws;
  console.log("Client ID:" + connectionIDCounter + " connected IP: " + ws._socket.remoteAddress + ":" + ws._socket.remotePort);

  ws.on('close', function() {
    console.log('Client Disconnected');
  });

});

wsDst.on('error', function(error) { console.log(error); });

var loop = setInterval(function() {
  var one = msg.pop();
  if (typeof one == 'string') {
    for(var i = allSocks.length - 1; i >= 0; i--) {
      if(allSocks[i].readyState == 1) {
        allSocks[i].send(new Buffer(one, "base64"));
        console.log('message sent');
      }
    }
  }
}, 50);

wsSrc.on('error', function(error) { console.log(error); /*setTimeout(wsStart(), 5000);*/ });


/*process.on('uncaughtException', function(err) {
  // try to reconnect
  if(err.code == 'ECONNREFUSED'){
    setTimeout(wsStart(), 5000);
  }
});*/