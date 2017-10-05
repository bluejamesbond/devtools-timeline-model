// In order to maintain consistent global scope across the files,
// and share natives like Array, etc, We will eval things within our sandbox
const fs = require('fs');
const resolve = require('resolve');

function requireval(scope, path) {
    const res = resolve.sync(path, {basedir: __dirname});
    const filesrc = fs.readFileSync(res, 'utf8');
    
    // eslint-disable-next-line no-with
    with(scope) {
        // eslint-disable-next-line no-eval
        eval(filesrc + '\n\n//# sourceURL=' + path);
    }
}

function createContext(scope) {
    scope.window = scope.self = scope.global = scope;
    scope.console = console;
    
    // establish our sandboxed globals
    scope.Runtime = class {};
    scope.Protocol = class {};
    scope.TreeElement = class { };
    scope.TextUtils = {};
    
    // from generated externs.
    // As of node 7.3, instantiating these globals must be here rather than in api-stubs.js
    scope.Accessibility = {};
    scope.Animation = {};
    scope.Audits = {};
    scope.Audits2 = {};
    scope.Audits2Worker = {};
    scope.Bindings = {};
    scope.CmModes = {};
    scope.Common = {};
    scope.Components = {};
    scope.Console = {};
    scope.DataGrid = {};
    scope.Devices = {};
    scope.Diff = {};
    scope.Elements = {};
    scope.Emulation = {};
    scope.Extensions = {};
    scope.FormatterWorker = {};
    scope.Gonzales = {};
    scope.HeapSnapshotModel = {};
    scope.HeapSnapshotWorker = {};
    scope.Host = {};
    scope.LayerViewer = {};
    scope.Layers = {};
    scope.Main = {};
    scope.Network = {};
    scope.Persistence = {};
    scope.Platform = {};
    scope.Profiler = {};
    scope.Resources = {};
    scope.Sass = {};
    scope.Screencast = {};
    scope.SDK = {};
    scope.Security = {};
    scope.Services = {};
    scope.Settings = {};
    scope.Snippets = {};
    scope.SourceFrame = {};
    scope.Sources = {};
    scope.Terminal = {};
    scope.TextEditor = {};
    scope.Timeline = {};
    scope.TimelineModel = {};
    scope.ToolboxBootstrap = {};
    scope.UI = {};
    scope.UtilitySharedWorker = {};
    scope.WorkerService = {};
    scope.Workspace = {};
    
    requireval(scope, './api-stubs.js');
}

module.exports = {
    requireval,
    createContext
}