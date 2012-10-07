// simple bounded list which loses the oldest
function SimpleBoundedQueue(capacity) {
    this.capacity = capacity || 10;
}
(function() {
    var count = 0;
    var headNode = null;

    this.offer = function(element) {
        var lastNode = headNode;
        while(lastNode && lastNode.next) {
            lastNode = lastNode.next;
        }
        var newNode = {};
        newNode.payload = element;
        if (lastNode) {
            lastNode.next = newNode;

            // shrink if we are at capacity
            if (this.size() > this.capacity) {
                headNode.payload = null;
                headNode = headNode.next;
                //console.log('Losing out data as we are slow in processing');
            }

        } else {
            headNode = newNode;
        }

    };
    this.remove = function() {
        var  node;
        if (headNode) {
            node = headNode;
            headNode = node.next;
            return node.payload;
        }
        return null;
    };

    this.size = function() {
        var ctr = 0, node;
        node = headNode;
        while(node) {
            node = node.next;
            ctr++;
        } ;

        return ctr;
    };

    this.toArray = function() {
        var elements = [], node;
        node = headNode;
        while(node) {
            elements.push(node.payload);
            node = node.next;
        } ;
        return elements;
    }
}.call(SimpleBoundedQueue.prototype))

// var activityLog = new SimpleBoundedQueue(20);
// simple tests till we move to jasmine for this
// _.times(5, function(val) {activityLog.offer(val)});
// activityLog.toArray();
