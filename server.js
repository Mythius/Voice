var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
var system = require('child_process');
var c = require('./iostream.js');

var file = {
	save: function(name,text){
		fs.writeFile(name,text,e=>{
			if(e) console.log(e);
		});
	},
	read: function(name,callback){
		fs.readFile(name,(error,buffer)=>{
			if (error) console.log(error);
			else callback(buffer.toString());
		});
	}
}

class client{
	static all = [];
	constructor(socket){
		this.socket = socket;
		this.name = null;
		this.tiles = [];
		client.all.push(this);
		socket.on('disconnect',e=>{
			let index = client.all.indexOf(this);
			if(index != -1){
				client.all.splice(index,1);
			}
		});
	}
	emit(name,dat){
		this.socket.emit(name,dat);
	}
}

const port = 80;
const path = __dirname+'/';

app.use(express.static(path+'site/'));
app.get(/.*/,function(request,response){
	response.sendFile(path+'site/');
});

http.listen(port,()=>{console.log('Serving Port: '+port)});

io.on('connection',socket=>{
	var c = new client(socket);
});


async function main(){
	let word = await c.in('Enter word: ');
	let pron = await getPronunciationWEB(word);
	console.log(pron);
	main();
}

main();


function getPronunciationWEB(word){
	return new Promise((res,rej)=>{
		let proc = system.spawn('curl',[`https://www.dictionary.com/browse/${word.trim()}`]);
		proc.stdout.on('data',data=>{
			let d = data.toString();
			if(d.match(`"pronunciation\":{\"ipa\":\"`)){
				let str = d.split('"pronunciation\":{\"ipa\":\"')[1];
				let ix = str.indexOf(';');
				if(ix==-1) str = str.split(';')[0];
				str = str.slice(0,str.indexOf(',')).replaceAll(/('|")/gi,'').replaceAll(/\\[^>]+>/g,'').trim();
				str = str.replaceAll(/;.+/g,'');
				res(str);
				return;
			}
		});
		proc.on('close',code=>{
			res('');
			return;
		});
	})
}