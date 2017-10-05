'use strict';
var {requireval, createContext} = require('./lib/sandbox-utils.js');

/* global HeapSnapshotWorker */
createContext(this);

requireval(this, 'chrome-devtools-frontend/front_end/common/Object.js');
requireval(this, 'chrome-devtools-frontend/front_end/platform/utilities.js');
requireval(this, 'chrome-devtools-frontend/front_end/common/ParsedURL.js');
requireval(this, 'chrome-devtools-frontend/front_end/common/UIString.js');
requireval(this, 'chrome-devtools-frontend/front_end/text_utils/TextUtils.js');

var createHeapSnapshot = function(stream, events) {
  return new Promise((resolve, reject) => {
    this.postMessage = function({eventName, data}) {
      if (events) {
        events.emit(eventName, data);
      }
    };

    this.addEventListener = function(...args) {
      // ignore
    };

    requireval(
      this,
      'chrome-devtools-frontend/front_end/heap_snapshot_model/HeapSnapshotModel.js'
    );
    requireval(
      this,
      'chrome-devtools-frontend/front_end/heap_snapshot_worker/HeapSnapshot.js'
    );
    requireval(
      this,
      'chrome-devtools-frontend/front_end/heap_snapshot_worker/HeapSnapshotLoader.js'
    );
    requireval(
      this,
      'chrome-devtools-frontend/front_end/heap_snapshot_worker/HeapSnapshotWorkerDispatcher.js'
    );
    requireval(
      this,
      'chrome-devtools-frontend/front_end/heap_snapshot_worker/HeapSnapshotWorker.js'
    );

    var dispatcher = new HeapSnapshotWorker.HeapSnapshotWorkerDispatcher(
      this,
      this.postMessage
    );
    var loader = new HeapSnapshotWorker.HeapSnapshotLoader(dispatcher);

    stream.on('data', chunk => {
      loader.write(chunk);
    });

    stream.on('error', reject);

    stream.on('end', () => {
      try {
        loader.close();
        resolve(loader.buildSnapshot());
      } catch (e) {
        reject(e);
      }
    });
  });
};
