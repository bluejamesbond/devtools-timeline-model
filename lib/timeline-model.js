'use strict';
var {requireval, createContext} = require('./lib/sandbox-utils.js');

/* global TimelineModel SDK Bindings Timeline TimelineModelTreeView */
createContext(this);

// chrome devtools frontend
requireval(this, 'chrome-devtools-frontend/front_end/common/Object.js');
requireval(this, 'chrome-devtools-frontend/front_end/platform/utilities.js');
requireval(this, 'chrome-devtools-frontend/front_end/common/ParsedURL.js');
requireval(this, 'chrome-devtools-frontend/front_end/common/UIString.js');
requireval(this, 'chrome-devtools-frontend/front_end/sdk/Target.js');
requireval(this, 'chrome-devtools-frontend/front_end/sdk/LayerTreeBase.js');
requireval(this, 'chrome-devtools-frontend/front_end/common/SegmentedRange.js');
requireval(this, 'chrome-devtools-frontend/front_end/bindings/TempFile.js');
requireval(this, 'chrome-devtools-frontend/front_end/sdk/TracingModel.js');
requireval(this, 'chrome-devtools-frontend/front_end/sdk/ProfileTreeModel.js');
requireval(this, 'chrome-devtools-frontend/front_end/timeline/TimelineUIUtils.js');
requireval(this, 'chrome-devtools-frontend/front_end/timeline_model/TimelineJSProfile.js');
requireval(this, 'chrome-devtools-frontend/front_end/sdk/CPUProfileDataModel.js');
requireval(this, 'chrome-devtools-frontend/front_end/layers/LayerTreeModel.js');
requireval(this, 'chrome-devtools-frontend/front_end/timeline_model/TimelineModel.js');
requireval(this, 'chrome-devtools-frontend/front_end/data_grid/SortableDataGrid.js');

requireval(this, 'chrome-devtools-frontend/front_end/timeline/TimelineTreeView.js');
requireval(this, 'chrome-devtools-frontend/front_end/timeline_model/TimelineProfileTree.js');
requireval(this, 'chrome-devtools-frontend/front_end/sdk/FilmStripModel.js');
requireval(this, 'chrome-devtools-frontend/front_end/timeline_model/TimelineIRModel.js');
requireval(this, 'chrome-devtools-frontend/front_end/timeline_model/TimelineFrameModel.js');

// minor configurations
requireval(this, './devtools-monkeypatches.js');

// polyfill the bottom-up and topdown tree sorting
requireval(this, './timeline-model-treeview.js');

class SandboxedModel {

  init(events) {
    // build empty models. (devtools) tracing model & timeline model
    //   from Timeline.TimelinePanel() constructor
    const tracingModelBackingStorage = new Bindings.TempFileBackingStorage('tracing');
    this._tracingModel = new SDK.TracingModel(tracingModelBackingStorage);
    this._timelineModel = new TimelineModel.TimelineModel(Timeline.TimelineUIUtils.visibleEventsFilter());

    if (typeof events === 'string') events = JSON.parse(events);
    // WebPagetest trace files put events in object under key `traceEvents`
    if (events.hasOwnProperty('traceEvents')) events = events.traceEvents;

    // reset models
    //   from Timeline.TimelinePanel._clear()
    this._timelineModel.reset();

    // populates with events, and call TracingModel.tracingComplete()
    this._tracingModel.setEventsForTest(events);

    // generate timeline model
    //   from Timeline.TimelinePanel.loadingComplete()
    const loadedFromFile = true;
    this._timelineModel.setEvents(this._tracingModel, loadedFromFile);

    return this;
  }

  _createGroupingFunction(groupBy) {
    return Timeline.AggregatedTimelineTreeView.prototype._groupingFunction(groupBy);
  }

  timelineModel() {
    return this._timelineModel;
  }

  tracingModel() {
    return this._tracingModel;
  }

  topDown() {
    return this.topDownGroupBy(Timeline.AggregatedTimelineTreeView.GroupBy.None);
  }

  topDownGroupBy(grouping) {
    const filters = [];
    filters.push(Timeline.TimelineUIUtils.visibleEventsFilter());
    filters.push(new TimelineModel.ExcludeTopLevelFilter());
    const nonessentialEvents = [
      TimelineModel.TimelineModel.RecordType.EventDispatch,
      TimelineModel.TimelineModel.RecordType.FunctionCall,
      TimelineModel.TimelineModel.RecordType.TimerFire
    ];
    filters.push(new TimelineModel.ExclusiveNameFilter(nonessentialEvents));

    const groupingAggregator = this._createGroupingFunction(Timeline.AggregatedTimelineTreeView.GroupBy[grouping]);
    const topDownGrouped = TimelineModel.TimelineProfileTree.buildTopDown(this._timelineModel.mainThreadEvents(),
        filters, /* startTime */ 0, /* endTime */ Infinity, groupingAggregator);

    // from Timeline.CallTreeTimelineTreeView._buildTree()
    if (grouping !== Timeline.AggregatedTimelineTreeView.GroupBy.None)
      new TimelineModel.TimelineAggregator().performGrouping(topDownGrouped); // group in-place

    new TimelineModelTreeView(topDownGrouped).sortingChanged('total', 'desc');
    return topDownGrouped;
  }

  bottomUp() {
    return this.bottomUpGroupBy(Timeline.AggregatedTimelineTreeView.GroupBy.None);
  }

  /**
   * @param  {!string} grouping Allowed values: None Category Subdomain Domain URL EventName
   * @return {!TimelineModel.TimelineProfileTree.Node} A grouped and sorted tree
   */
  bottomUpGroupBy(grouping) {
    const topDown = this.topDownGroupBy(grouping);

    const bottomUpGrouped = TimelineModel.TimelineProfileTree.buildBottomUp(topDown);
    new TimelineModelTreeView(bottomUpGrouped).sortingChanged('self', 'desc');

    // todo: understand why an empty key'd entry is created here
    bottomUpGrouped.children.delete('');
    return bottomUpGrouped;
  }

  frameModel() {
    const frameModel = new TimelineModel.TimelineFrameModel(event =>
      Timeline.TimelineUIUtils.eventStyle(event).category.name
    );
    frameModel.addTraceEvents({ /* target */ },
      this._timelineModel.inspectedTargetEvents(), this._timelineModel.sessionId() || '');
    return frameModel;
  }

  filmStripModel() {
    return new SDK.FilmStripModel(this._tracingModel);
  }

  interactionModel() {
    const irModel = new TimelineModel.TimelineIRModel();
    irModel.populate(this._timelineModel);
    return irModel;
  }
}

var sandboxedModel = new SandboxedModel();
// no exports as we're a sandboxed/eval'd module.
