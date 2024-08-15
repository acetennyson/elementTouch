class DragElement{
    elt = null
    handle = null
    mouse = {x:0, y:0}
    offset = {x:0, y:0}
    t = false; 
    disabled = false;
    constructor(element, t){
        this.t = t;
        this.elt = (typeof element == "string")?document.getElementById(element):element;
        this.handle = document.getElementById(this.elt.id + "-handle");
        this.load()
        
    }
    load(){
        if(this.handle){
            this.handle.ontouchstart = this.handle.onmousedown = this.holdE.bind(this)
        }else{
            this.elt.ontouchstart = this.elt.onmousedown = this.holdE.bind(this)
        }
    }
    setElement(element){
        this.elt = (typeof element == "string")?document.getElementById(element):element;
        this.handle = document.getElementById(this.elt.id + "-handle");
        this.load()
    }
    holdE(event){
        if(this.disabled)return;
console.log("started", event)
        this.mouse.x = event.clientX
        this.mouse.y = event.clientY
        document.onmousemove = document.ontouchmove = this.t?this.move2E.bind(this):this.moveE.bind(this)
        document.ontouchend = document.onmouseup = this.releaseE.bind(this);
        this.elt.onmouseup = this.releaseE.bind(this)
    }
    moveE(event){
        if(this.disabled){
            this.releaseE()
            return;
        }
        this.offset.x = this.mouse.x - (event.clientX?event.clientX:event.changedTouches[0].clientX)
        this.offset.y = this.mouse.y - (event.clientY?event.clientY:event.changedTouches[0].clientY)

        this.mouse = {x: (event.clientX?event.clientX:event.changedTouches[0].clientX), y:(event.clientY?event.clientY:event.changedTouches[0].clientY)};

        this.elt.style.left = (this.elt.offsetLeft - this.offset.x) + "px";
        this.elt.style.top = (this.elt.offsetTop - this.offset.y) + "px";
    }

    move2E(event){
        if(this.disabled){
            this.releaseE()
            return;
        }
        this.mouse = {x: event.clientX, y:event.clientY};

        this.elt.style.left = this.mouse.x + "px";
        this.elt.style.top = this.mouse.y + "px";
    }

    releaseE(){
        document.onmousemove = document.ontouchmove = null
        document.ontouchend = document.onmouseup = null
        this.elt.onmouseup = this.elt.ontouchend = null
    }
}