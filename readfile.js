const readline = require('readline');
const fs = require('fs');
const mysql = require('mysql');

const connection = mysql.createConnection({
  multipleStatements: true,
  host: "localhost",
  user: "root",
  password: "password",
  database : "lc_podcastdb"
});
connection.connect();
const db = connection;
db.query("USE lc_podcastdb");

function analyze_text(difficult_words){
	var dw = difficult_words.map(row => row.distinct_difficult_words)
	var lines = [] 
	const readInterface = readline.createInterface({
	    input: fs.createReadStream('full_text_edited.txt'),
	    //output: process.stdout,
	    console: false
	});

	readInterface.on('line', function(line) {
		let word_array = line.split(',')
	    lines.push({sentence: line.replace(/,/g,""), hard_words: Array.from(new Set(word_array.filter(value => dw.includes(value))))});
	})
	.on('close', function(line) {
		lines.forEach(function (item, index) {
	  		console.log('sentence:',item.sentence,'\n', 'hard words:', item.hard_words);
	  		item.hard_words.forEach(function(hard_word,index){
	  			console.log(hard_word + ':')
	  		})
	  		console.log('\n')
		});
	});
}


db.query("CALL get_difficult_words();", null, function(err, results, fields) {
	if (!err) {
		console.log('this.sql', this.sql);
		analyze_text(results[0])
	}
	else {
		process.kill(process.pid, 'SIGTERM')
	}

});

// find (\w{1})
//replace \1,


