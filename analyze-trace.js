var trace = require('fs').readFileSync('./analyze-trace.input', 'utf8').split('\n');

var dispatched = [];
var total = [];

for (var i = 0, l = trace[i]; i < trace.length; l = trace[++i]) {
  var m = l.match(/(\d+) dispatch sendKey (\d+)/);
  if (!m) {
    var y = l.match(/(\d+) receive keyup  (\d+)/);
    if (!y) continue;
    var fnd = dispatched.filter(function(d) {
      return d.keycode === y[2]
    });
    if (!fnd.length) continue;

    total.push(Number(y[1]) - fnd[0].time);

    // console.log(String.fromCharCode(y[2]), y[2], 'took', Number(y[1]) - fnd[0].time, 'ms');

    dispatched.splice(dispatched.indexOf(fnd[0]), 1);

    continue;
  }
  dispatched.push({ keycode: m[2], time: Number(m[1]) });

  // console.log(dispatched)
  // break;
}

// console.log('-----------------')
console.log('Total:', total.length, 'events');
console.log('Min:', total.reduce(function(curr, next) { return next > curr ? curr : next }, 99999), 'ms')
console.log('Max:', total.reduce(function(curr, next) { return next > curr ? next : curr }, 0), 'ms')
console.log('Avg:', (total.reduce(function(curr, next) { return next + curr }, 0) / total.length) | 0, 'ms')
