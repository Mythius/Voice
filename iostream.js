const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

exports.out = function(s) {
    console.log(s);
}
exports.input = function(q, c) {
    readline.question(q + ' ', c);
}
exports.close = function() {
    readline.question('\nClick ENTER to exit', e => {
        readline.close();
    });
}
exports.in = async function(q) {
    return new Promise(resolve => {
        readline.question(q, text => {
            resolve(text);
        });
    });
}