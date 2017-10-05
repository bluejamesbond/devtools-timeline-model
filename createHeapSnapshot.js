'use strict';

var fs = require('fs');
var vm = require('vm');

/* eslint-disable no-native-reassign */
if (typeof __dirname === 'undefined') {
  __dirname = '';
}
/* eslint-enable no-native-reassign */

function createHeapSnapshot(stream, events) {
  // Everything happens in a sandboxed vm context, to keep globals and natives separate.
  // First, sandboxed contexts don't have any globals from node, so we whitelist a few we'll provide for it.
  var glob = {
    require: require,
    global: global,
    console: console,
    __dirname: __dirname
  };
  // We read in our script to run, and create a vm.Script object
  /* eslint-disable no-path-concat */
  var script = new vm.Script(
    fs.readFileSync(__dirname + '/lib/heap-snapshot.js', 'utf8')
  );
  /* eslint-enable no-path-concat */
  // We create a new V8 context with our globals
  var ctx = vm.createContext(glob);
  // We evaluate the `vm.Script` in the new context
  script.runInContext(ctx);
  // We pull the local `instance` variable out, to use as our proxy object
  return ctx.createHeapSnapshot(stream, events);
}

module.exports = createHeapSnapshot;

// (async () => {
//  var EventEmitter = require('events');
//   const events = new EventEmitter();
//   events.on('ProgressUpdate', data => console.log(data));

//   const snapshot = await createHeapSnapshot(fs.createReadStream('./heap.heapsnapshot', 'utf8'), events);
// })()
