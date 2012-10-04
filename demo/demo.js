/*
Copyright (c) 2012 Juan Mellado

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
// original code from http://code.google.com/p/js-handtracking/
function Demo(){
};

(function() {
    var startPos, endPos;
    this.start =  function() {
        var self = this;
        this.tracker = new HT.Tracker( {fast: true} );
        this.video = $("#video")[0];
        this.canvas = $("#canvas")[0];
        this.context = this.canvas.getContext("2d");

        this.canvas.width = parseInt(this.canvas.style.width) / 2;
        this.canvas.height = parseInt(this.canvas.style.height) / 2;
        
        this.thumbNail = this.context.createImageData(this.canvas.width * 0.2, this.canvas.height * 0.2);
        
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        if (navigator.getUserMedia){
            navigator.getUserMedia({video:true},
                                   function(stream){ return self.videoReady(stream); },
                                   function(error){ return self.videoError(error); } );
        }
    };

    this.videoReady = function(stream){
        this.video.src = window.webkitURL.createObjectURL(stream);
        this.tick();
    };

    this.videoError = function(error){
        console.log(error);
    };

    this.tick = function(){
        var that = this, image, candidate;
        
        requestAnimationFrame( function() { return that.tick(); } );
        
        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA){
            image = this.snapshot();
            candidate = this.tracker.detect(image);
            
            this.draw(candidate);
            if (startPos && endPos) {
                this.highlight(startPos, endPos);
            }
        }
    };

    this.snapshot = function(){
        this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    };

    this.draw = function(candidate){
        if (candidate){
            this.context.fillStyle = "black";
            this.context.fillRect(0, 0, 600, 400);
            this.context.putImageData(
                this.createImage(this.tracker.mask, this.thumbNail), 
                this.canvas.width/2,
                this.canvas.height - this.thumbNail.height);
        }
    };

    this.createImage = function(imageSrc, imageDst){
        var src = imageSrc.data, dst = imageDst.data,
        width = imageSrc.width, span = 4 * width,
        len = src.length, i = 0, j = 0, k = 0;
        
        for(i = 0; i < len; i += span){
            
            for(j = 0; j < width; j += 5){
                
                dst[k] = dst[k + 1] = dst[k + 2] = src[i];
                dst[k + 3] = 255;
                k += 4;
                
                i += 5;
            }
        }
        
        return imageDst;
    };
}).call(Demo.prototype);


// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
