const readline = require('readline');
const fs = require('fs');

var lines = [] 
const readInterface = readline.createInterface({
    input: fs.createReadStream('full_text_edited.txt'),
    output: process.stdout,
    console: false
});

readInterface.on('line', function(line) {
    lines.push({sentence: line.replace(/,/g,""), words: line.split(',')});
})
.on('close', function(line) {
 console.log(lines)
});
