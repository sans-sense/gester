// AN: Classes for tracking canvas and gesture processing
function CanvasTracker(canvas) {
    this.canvas = function() {return canvas;};
}

(function() {
    var startPos = {x:0, y:0};
    var endPos = {x:0, y:0};
    var gestureProcessor = new GestureProcessor();

    // get the actual mouse position on the canvas
    function getMousePosition(canvas, event) {
        var rect = canvas.getBoundingClientRect();
        var pos = { x: (event.clientX - rect.left),  y :(event.clientY - rect.top) };
        return pos;
    }

    // TODO add support to outline the skin region
    function setColorFromRegion(tracker) {

    }
    this.trackSelection = function(demo) {
        var canvas = this.canvas();
        canvas.addEventListener('mousedown', function(event) {
            startPos = getMousePosition(canvas, event);
        });
        canvas.addEventListener('mouseup', function(event) {
            endPos = getMousePosition(canvas, event);
            console.log('could have drawn rect between ' + endPos.x + ' ' +  startPos.x + ' and ' + endPos.y + ' ' +  startPos.y);
            demo.highlight(startPos, endPos);
        });
    };
    this.addSamplingSupport = function(elementId) {
        var jqueryElement = $('#' + elementId);
        var self = this;
        $(jqueryElement).click(function() {setColorFromRegion(self)});
    };
    this.logGestures = function(elementId) {
        gestureProcessor.setLogConsole(elementId);
    };
    this.queueActivityPoint = function(activityPoints) {
        gestureProcessor.queue(activityPoints);
    };
    this.enableGestureRecognition = function(elementId) {
        this.logGestures(elementId);
        gestureProcessor.process();
    };
    this.registerGestureListener = function(callback) {
        gestureProcessor.registerListener(callback);
    }
}.call(CanvasTracker.prototype));

CanvasTracker.getWebsocketListener  =  function() {
    var socket = new WebSocket('ws://localhost:1337'), transCounter = 0;
    socket.onopen = function() {
        console.log('socket open');
    };
    function actOnSocket(data) {
        transCounter++;
        if (transCounter == 50) {
            socket.close();
            console.log('closed socket');
        } else {
            socket.send(JSON.stringify(data));
        }
    }
    return function(activityPoints) {
        actOnSocket(activityPoints);
    }
};



// TODO check on how drag is implemented

// Processes gestures, 
function GestureProcessor() {

}

(function(){

    var currentGesture = null;
    var activityLog = new SimpleBoundedQueue(20);
    var lastActivity = null;
    var deltaThreshold = 100;
    var proto = this;
    var logConsole = null;
    var gestureLog = new SimpleBoundedQueue(20);
    var gestureListeners = [];

    function logChanges() {
        if (logConsole) {
            gestureLog.offer((currentGesture && currentGesture.toString()) || 'No Gesture');
            console.log(currentGesture.toString());
            $(logConsole).html(gestureLog.toArray());
        }
    }

    function signalEndofGesture() {
        if (currentGesture) {
            currentGesture.isCompleted();
        }
        currentGesture = null;
    }

    function computeAverageX(delta) {
        var innerCtr, aggXVal,  avgXVal;
        aggXVal = _.reduce(delta, function(memo, val) {return memo + (val % 600)}, 0);
        avgXVal = aggXVal / delta.length
        return avgXVal;

    }

    // diff of two arrays with values contained only in second slice
    function compareArrays(firstSlice, secondSlice) {
        var deltas = [];
        var jPos = 0;
        var i, j;
        var prevMatch = {};
        var tolerance = 60;

        for (i = 0; i < firstSlice.length; i++) {
            var firstSliceVal = firstSlice[i];
            for (j = jPos; j < secondSlice.length; j++){
                // does not work for edges
                if (Math.abs(secondSlice[j] - firstSliceVal) < tolerance) {
                    jPos = j;
                    break;
                } else if (secondSlice[j] > firstSliceVal) {
                    // deltas.push(firstSliceVal);
                    break;
                } else if (firstSliceVal > secondSlice[j]) {
                    if ((i === 0) || (Math.abs(secondSlice[j] - firstSlice[i - 1]) > tolerance)){
                        deltas.push(secondSlice[j]);
                    }
                    jPos = j + 1;
                }
            } 
        }
        var secondSliceRemaining = secondSlice.slice(jPos);
        var lastFirstSliceVal = firstSlice[firstSlice.length - 1];

        for (i = 0; i < secondSliceRemaining.length; i++) {
            if (Math.abs(secondSliceRemaining[i] - lastFirstSliceVal) > tolerance) {
                deltas = deltas.concat(secondSliceRemaining.slice(i, secondSliceRemaining.length));
                break;
            }
        }
        return deltas;
    }

    function publishGesture() {
        _.each(gestureListeners, function(listener) {listener.call(this, currentGesture)});
    }

    this.registerListener = function(listener) {
        gestureListeners.push(listener);
    }

    this.setLogConsole = function(elementId) {
        logConsole = '#' + elementId;
    }
    this.queue = function(activityPoints) {
        activityLog.offer(activityPoints);
    }
    // function called via callback, do not depend on this
    this.process = function() {
        var activity,  overallChange, newXPosition;
        activity = activityLog.remove()

        // TODO refactor ugly ifs
        if (activity) {
            if (lastActivity) {
                overallChange = compareArrays(lastActivity, activity);
                if (overallChange.length > deltaThreshold) {
                    newXPosition = computeAverageX(overallChange);
                    if (!(currentGesture)) {
                        currentGesture = new Gesture();
                    }

                    currentGesture.updateXPosition(overallChange, newXPosition);
                    if (currentGesture && currentGesture.direction) {
                        publishGesture();
                        logChanges();
                    }
                } else if (currentGesture) {
                    signalEndofGesture();
                }
            }
            lastActivity = activity;
        }
        setTimeout(proto.process, 20);
    }

}).call(GestureProcessor.prototype)

var gestureCounter = 0;

// Like Events generic type for all gestures.
function Gesture() {
    this.xPosition = 0;
    this.direction = null;
    this.delta = 0;
    this.createTime = Date.now();
    this.changes = [];
    this.id = gestureCounter++;
}

Gesture.types = ['slide-left', 'slide-right'];

(function() {
    var lastUpdated = null;
    this.isCompleted = function() {
        this.endTime = Date.now();
        this.totalTime = this.endTime - this.createTime;
    };
    this.updateXPosition = function(overallChange, newXPosition) {
        if (this.xPosition) {
            this.delta = newXPosition - this.xPosition;
            this.direction = Gesture.types[(((this.delta) > 0)? 0 : 1)]
        }
        this.xPosition = newXPosition;
        this.totalTime = Date.now() - this.createTime;
        this.changes.push(overallChange.length)
        lastUpdated = new Date();
    };

    this.toString = function() {
        return '[' + this.id + ']' + this.direction + ' ' + this.delta+ ' ' +this.totalTime + ' ' + this.changes;
    }

        // var gesture = new Gesture(); gesture.updateXPosition(20); gesture.updateXPosition(40); gesture.direction;
}).call(Gesture.prototype);

