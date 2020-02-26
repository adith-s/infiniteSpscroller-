
(function(ctx){
    
    function InfiniteSidePanelScroller(options){
        this.parent              = options.parent;
        this.initialElementCount = options.initialElementCount;
        this.offsetHeight        = options.offsetHeight;
        this.loaderTemplate      = options.loaderTemplate;
        this.endTemplate         = options.endTemplate;
        this.currInitElement     = this.initialElementCount;
        this.scrollTopQueue      = [];
        this.scrollBottomQueue   = [];
        this.undoStack           = [];
        this.redoStack           = [];
        this.canRequest          = true;
        this.endReached          = false;
    }

    InfiniteSidePanelScroller.prototype = {
        initView : function(){
            var self = this;
            this.addCardToScroller().then(function(cardList){                
                self.scrollBottomQueue = self.scrollBottomQueue.concat(cardList);
                while(self.currInitElement-- !=0 && self.scrollBottomQueue.length != 0){
                    var card = self.scrollBottomQueue.shift();
                    self.parent.appendChild(card);
                }
            });
            this._bindEvent();
        },
        getNextElement : function(){
            var self = this;
            if(this.canRequest && !this.endReached){
                this.canRequest = false;
                this.parent.appendChild(this.loaderTemplate);
                this.addCardToScroller().then(function(cardList){
                    var isEnd = self.isEndReached();
                    self.canRequest = true;
                    self.parent.removeChild(self.parent.lastElementChild);
                    self.scrollBottomQueue = self.scrollBottomQueue.concat(cardList);
                    if(isEnd){
                        self.endReached = true;
                        self.scrollBottomQueue.push(self.endTemplate);
                    }
                    self.appendToBottom();
                });
            }
        },
        updateView : function(){
            this.canRequest && this.appendToBottom();
            this.appendToTop();
        },
        appendToBottom : function(){
            if(this.canAppendAtBottom()){
                if(this.scrollBottomQueue.length != 0){
                    this.parent.appendChild(this.scrollBottomQueue.shift());
                }
                else if(!this.endReached){
                    this.getNextElement();
                }
            }
            else{
                this.removeAtBottom();
            }
        },
        appendToTop : function(){
            if(!this.canAppendAtTop()){
                    this.removeAtTop();
            }
            else if(this.scrollTopQueue.length !=0){
                var card = this.scrollTopQueue.pop();
                this.parent.insertBefore(card,this.parent.firstElementChild);
            }
            
        },
        removeAtBottom : function(){
            var lastCard = this.parent.lastElementChild;
            this.scrollBottomQueue.unshift(lastCard);
            this.parent.lastElementChild.remove();
        },
        removeAtTop : function(){
            var firstCard = this.parent.firstElementChild;
            this.scrollTopQueue.push(firstCard);
            this.parent.firstElementChild.remove();
        },
        canAppendAtBottom : function(){
            var lastCard = this.parent.lastElementChild;
            return this.parent.clientTop + this.parent.clientHeight + this.offsetHeight >= lastCard.getBoundingClientRect().top;
        },
        canAppendAtTop : function(){
            var firstCard = this.parent.firstElementChild;
            return this.parent.clientTop - this.offsetHeight <= firstCard.getBoundingClientRect().bottom;
        },
        doUndo : function(){
            var undoObj = this.undoStack.pop();
            if(undoObj){
                var elements = undoObj.Elements;
                this.attachOnUndo(elements);
                this.redoStack.push(undoObj);
                return undoObj.listOfID;
            }
        },
        doRedo : function(){
            var redoObj = this.redoStack.pop();
            if(redoObj){
                this.deleteBasedOnId(redoObj.listOfID);
                return redoObj.listOfID;
            }
        },
        attachOnUndo : function(elements){
            for(var i=elements.length-1;i>=0;i--){
                var ele = elements[i];
                !(this.attachToViewPort(ele)) && !(this.attachToQueue(this.scrollTopQueue,ele)) 
                        && !(this.attachToQueue(this.scrollBottomQueue,ele));
            }
        },
        attachToViewPort : function(ele){
            if(ele){
                var adjacentDomID = ele.adjacentDomID;
                var deletedDom = ele.deletedDom;
                var adjacentDom = this.parent.querySelector("#"+adjacentDomID);
                if(adjacentDom){
                    this.parent.insertBefore(deletedDom,adjacentDom);
                    return true;
                }
            }
            return false;
        },
        attachToQueue : function(queue,ele){
            var adjacentDomID = ele.adjacentDomID;
            for(var i=0;i<queue.length;i++){
                var topEle = queue[i];
                if(adjacentDomID == topEle.ID){
                    queue.splice(i,0,ele.deletedDom);
                    return true;
                }
            }
            return false;
        },
        deleteBasedOnId :function(listOfID){
            var queueBasedList = [];
            var tempList = [];
            var undoObj = {};
            tempList = tempList.concat(this.findAndDelete(listOfID,this.scrollTopQueue));
            tempList = tempList.concat(this.findAndDelete(listOfID,this.scrollBottomQueue));
            for(var i=0 ; i<listOfID.length; i++){
                var cardID = listOfID[i];
                var obj = this.findAndDeleteInViewPort(cardID);
                if(obj){
                    tempList.push(obj);
                    obj.deletedDom.remove();
                }
                else{
                    queueBasedList.push(cardID);
                }
            }
            undoObj.Elements = tempList;
            undoObj.listOfID = listOfID;
            this.undoStack.push(undoObj);
        },
        findAndDeleteInViewPort(ID){
            var foundCard = this.parent.querySelector("#"+ID);
            if(foundCard){
                var obj = {
                    deletedDom : foundCard,
                    adjacentDomID : foundCard.nextElementSibling.id
                }
                return obj;
            }

        },
        findAndDelete : function(listOfID,searchIn){
            var list = [];
            for(var j=0; j<listOfID.length ; j++){
                var ID = listOfID[j];
                for(var i=0; i<searchIn.length ; i++){
                    if(ID == searchIn[i].id){
                        var obj = {
                            deletedDom  : searchIn[i],
                            adjacentDomID : searchIn[i+1].id
                        }
                        list.push(obj);
                        searchIn.splice(i,1);
                    }
                }
            }
            return list;
        },
        clearScroller : function(){
            this.currInitElement   = this.initialElementCount;
            this.scrollTopQueue    = [];
            this.scrollBottomQueue = [];
            this.undoStack         = [];
            this.redoStack         = [];
            this.endReached        = false;
        },
        _bindEvent : function(){
            this.parent.addEventListener("wheel",throttling(this.updateView,100).bind(this));
        },
        addCardToScroller  : function(){
            //override this function and @return as promise
        },
        isEndReached  : function(){
            //override this function and @return as bool (true => if end reached)
        }
    }

    var cardTemplate = document.getElementById("cardTemplate");
    var container = document.getElementById("containerGrid");
    var loadertemp = document.getElementById("loaderTemplate").content.cloneNode(true).firstElementChild;
    var endTemp = document.getElementById("endTemplate").content.cloneNode(true).firstElementChild;

    var hurrayTheEnd = false;
    var opt = {
        parent              : container,
        initialElementCount : 30,
        offsetHeight        : 90,
        loaderTemplate      : loadertemp,
        endTemplate         : endTemp
    }
    var cardId = 1;
    function getCard(){
        var cardList = [];
        for(i=0;i<30;i++){
            var card = cardTemplate.content.cloneNode(true).firstElementChild;
            card.id = "p"+cardId;
            card.innerText = cardId++;
            cardList.push(card);
        }
        if(cardId >=100){
            hurrayTheEnd = true;
        }
        return cardList;
    }

    var infiniteScroller = new InfiniteSidePanelScroller(opt);
    window.fun = infiniteScroller;
    infiniteScroller.addCardToScroller = function(){
        var promise = new Promise(function(resolve,reject){
            var cardList = getCard();
           setTimeout(()=>{console.log("calling resolve");resolve(cardList)},2000);
        // resolve(cardList)
        });
        return promise;
    }
    infiniteScroller.isEndReached =function(){
        return hurrayTheEnd;
    }
    ctx.initView = infiniteScroller.initView.bind(infiniteScroller);
    ctx.infiniteScroller = infiniteScroller;

    function throttling(func,limit){
        let flag = true;
        return function(){
            var context = this,args = arguments;
            if(flag){
                func.apply(context,args);
                flag = false;
                setTimeout(()=>{
                    flag = true;
                },limit);
            }
        }
    }
    ctx.InfiniteSidePanelScroller = InfiniteSidePanelScroller;


})(this);