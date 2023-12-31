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
	socket.on('getlist',words=>{
		let word1 = words[0];
		let all_lists = [];
		for(let word of words){
			all_lists.push(wordToList(word));
		}
		// console.log('');
		Promise.all(all_lists).then(values=>{
			c.emit('list',values);
		});
	})
});

var sounds;
file.read('sounds.json',data=>{sounds=JSON.parse(data)});

async function wordToList(word){
	let pron = await getPronunciationWEB(word);
	let paths = convert_to_paths(pron);
	console.log(pron);
	return paths;
}

async function main(){
	let word = await c.in('Enter word: ');
	let pron = await getPronunciationWEB(word);
	console.log(pron);
	let paths = convert_to_paths(pron);
	console.log(paths);
	main();
}


main();

function convert_to_paths(pron){
	// console.log(`Sounds:${sounds.join(',')}`);
	pron = pron.replaceAll(' ','_');
	let result = [];
	for(let i=0;i<pron.length;i++){
	if(pron[i]=='ˈ'||pron[i]=='ˌ'||pron[i]=='_') continue;
		let c = false;
		let j=pron.length;
		while(j>=i){
			let sub = pron.slice(i,j+1);
			// console.log(`Tried:`+sub);
			if(sounds.indexOf(sub)!=-1){
				result.push(`sounds/${sub}.wav`);
				c = true;
				i=j;
				break;
			}
			j--;
		}
		for(let j=i+1;j<pron.length;j++){
		}
		if(!c){
			console.log("Couldn't Find:"+pron.slice(i));
		}
	}
	result.push('sounds/_.wav');
	result.push('sounds/_.wav');
	result.push('sounds/_.wav');
	return result;
}


var saved_prons;
file.read('saved_pronunciations.json',data=>{saved_prons=JSON.parse(data)});

function getPronunciationWEB(word){
	word = word.toLowerCase();
	if(word in saved_prons){
		return saved_prons[word];
	}
	return new Promise((res,rej)=>{
		let proc = system.spawn('curl',[`https://www.dictionary.com/browse/${word.trim()}`]);
		proc.stdout.on('data',data=>{
			let d = data.toString();
			if(d.match(`"pronunciation\":{\"ipa\":\"`)){
				let str = d.split('"pronunciation\":{\"ipa\":\"')[1];
				let ix = str.indexOf(';');
				if(ix==-1) str = str.split(';')[0];
				str = str.slice(0,str.indexOf(',')).replaceAll(/('|")/gi,'').replaceAll(/\\[^>]+>/g,'').trim();
				str = str.replaceAll(/;.+/g,'').replaceAll(/stressed/g,'').trim();
				saved_prons[word]=str;
				file.save('saved_pronunciations.json',JSON.stringify(saved_prons))
				res(str);
				return;
			}
		});
		proc.on('close',code=>{
			res('#');
			return;
		});
	})
}