const fs = require('fs');
const readline = require('readline');
const ObjectsToCsv = require('objects-to-csv');

var instream = fs.createReadStream('pg29765.txt');
var rl = readline.createInterface(instream);

const final = {};
var currentWord = '';
var definition = '';

rl.on('line', (line) => {
  if (line === "End of Project Gutenberg's Webster's Unabridged Dictionary, by Various") rl.close();

  if (line.length && line[0] !== '*') {
    
    /* WORD DETECTION */
    if (line === line.toUpperCase() && isNaN(line)) { 
      if (line !== currentWord) currentWord = line; 
      if (!final[currentWord]) final[currentWord] = []; 
    }

    /* DEFN DETECTION */
    if (final[currentWord]) {
      //case: if first word is literally "Defn:"
      if (line.substr(0, 4) === 'Defn') definition += line.substr(6);

      //case: lettered defns (ex. if the first word in the line is '(a)')
      else if (line.split(' ')[0][0] === '(') definition += line.split(' ').slice(1).join(' ')

      //case: numbered defns (ex. if the first word in the line is '1.')
        //also have to account for if this numbered defn is just a preceding origin for the real defn --> ignore this definition, because it precedes the real defn
      else if (isNaN(line.split(' ')[0][0]) === false && line.split(' ').length > 2) definition += line.split(' ').slice(1).join(' ')
      
      //case: multi-line definitions
      else if (definition.length) definition = `${definition} ${line}`
    }  
  } else { //whenever you read a blank line, reset the current defn
    (final[currentWord] && definition.length) ? final[currentWord].push(definition) : '';
    definition = '';
  }
})

rl.on('close', () => {
  const output = [];
  Object.entries(final).forEach( kv => {
    output.push({
      'Word': kv[0],
      'Definition': JSON.stringify(kv[1])
    })
  })

  let csv = new ObjectsToCsv(output)
  csv.toDisk('data.csv');

})


/*Weird edge cases: 
  - double white spaces between words: solution - sanitize lines by removing extra white spaces
   */