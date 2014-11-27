var clone = require('clone');

function MemoryBackend() {
    var self = this;

    self.data        = {};
    self.shouldCache = false;
}

// process.nextTick() keeps Zalgo contained
// http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony

// cb(err, data, extraKeyInfo)
MemoryBackend.prototype.get = function(keyStr, cb) {
    var self = this;

    process.nextTick(function() {
        if (keyStr in self.data) {
            var value = self.data[keyStr];
            value.lastRetrieved = +new Date;
            cb(null, clone(value));
        } else {
            cb(null, false);
        }
    });
};

// cb(err)
MemoryBackend.prototype.set = function(keyStr, value, cb) {
    var self = this;

    process.nextTick(function() {
        self.data[keyStr] = clone(value);
        cb(null);
    });
};

MemoryBackend.prototype.delete = function(keyStr, cb) {
    var self = this;

    process.nextTick(function() {
        if (keyStr in self.data) {
            delete self.data[keyStr];
            cb(null);
        } else {
            cb(new Error(
                'The specified key was not found in the MemoryBackend data store.'));
        }
    });
};

// cbEntry(err, key, value)
// cbDone(err, numEntries)
MemoryBackend.prototype.list = function(cbEntry, cbDone) {
    var self = this;

    var keys = Object.keys(self.data);

    function send(i) {
        process.nextTick(function() {
            if (i == keys.length) {
                cbDone(null, keys.length);
            } else {
                var entry = self.data[keys[i]];
                if (typeof entry != 'undefined') {
                    // This entry could have been deleted
                    cbEntry(null, keys[i], clone(entry));
                }
                send(i + 1);
            }
        });
    }

    send(0);
};

module.exports = MemoryBackend;
