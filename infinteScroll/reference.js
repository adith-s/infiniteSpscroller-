var InfiniteScroller = (function () {
    var defaultOptions = {
      chunkSize: 10,
      offset: 20,
      firstVisibleItems: 20
    };
  
    var DATA_MEMBER = 'infinite-scroller';
  
    function InfiniteScroller(args) {
      var container;
      var cachedElements = [];
      var options;
      var currentFirstVisibleItems;
  
      function init(args) {
        container = args.container;
        options = $.extend({}, defaultOptions, args);
        currentFirstVisibleItems = options.firstVisibleItems;
  
        bindScroll(container.parent());
      }
  
      init.apply(null, arguments);
  
      function appendChunk() {
        var index = 0;
  
        // append chenk of elements
        while (index++ < options.chunkSize && cachedElements.length) {
          container.append(cachedElements.shift());
        } 
      }
  
      function shouldAppendChunk(scrollHeight, scrollPosition, height) {
        // check if the scrollbar near to the end
        return scrollHeight - scrollPosition <= (height + options.offset) && cachedElements.length;
      }
  
      function bindScroll(parent) {
        parent.on('scroll', function (event) {
          var scrolledContainer = event.currentTarget;
          if (shouldAppendChunk(scrolledContainer.scrollHeight, scrolledContainer.scrollTop, scrolledContainer.clientHeight)) {
            appendChunk();
          }
        });
      }
  
      
      /**
       * append the given elements to the container.
       * append until reached to the limit visible elements
       */
      this.appendElements = function appendElements(elements) {
        for (var i = 0; i < elements.length; i++) {
          if (currentFirstVisibleItems-- > 0) {
            container.append(elements[i]);
          } else {
            cachedElements.push(elements[i]);
          }
        }
      };
  
      /**
       * clear and reset container
       */
      this.clear = function clear() {
        cachedElements = [];
        container.empty();
        currentFirstVisibleItems = options.firstVisibleItems;
      };
    }
  
    return {
      /**
       * Get or create infinite scroll for the given container.
       * - If the given container have infinite scroll API, it will return it. otherwise it will create a new one.
       * @param options -
       *      chunkSize: {int} - how many elements to load each time the scroll reaches the end. default is 10.
       *      offset: {int} - how many px from the end of the scroll should load the next chunk - default is 20.
       *      firstVisibleItems: {int} - how many elements to load for the first time. default is 20.
       * @return infinite Scroller API of the specific element
       */
      getOrCreate: function getOrCreate(options) {
        var parent = options.container.parent();
        var instanceFromElement = this.get(parent);
  
        if (instanceFromElement) {
          return instanceFromElement;
        }
  
        var infiniteScroller = new InfiniteScroller(options);
        parent.data(DATA_MEMBER, infiniteScroller);
  
        return infiniteScroller;
      },
      /**
       * Get the infinite scroll API from the given container.
       * @param container - Jquery element.
       * @return Infinite Scroller API of the specific element
       */
      get: function get(container) {
        return container.data(DATA_MEMBER);
      }
    };
  }());

  /**
   * function debounce(fn, d) {
        let timer;
        return  function(){
            var context = this,args = arguments;
            if(timer){
                clearTimeout(timer);
            }
            timer = setTimeout(function(){
                fn.apply(context,args);
            },d);
        }        
    }s
   */