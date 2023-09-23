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

async function main(){

	let data = await c.in('Enter word: ');

	let prog = await getPronunciationWEB(data);

	console.log(prog);

	main();



}


main();




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