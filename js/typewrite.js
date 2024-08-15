const resolution = (elt)=>{
    return {x:Number(elt.clientWidth), y:Number(elt.clientHeight)};
},
position = (elt)=>{
    return {x:Number(elt.scrollLeft), y:Number(elt.scrollTop)};
},
offset = (elt)=>{
    return {x:Number(elt.offsetLeft), y:Number(elt.offsetTop)};
},
bound = (elt, percent = 0)=>{
    percent /= 100;
    let res = resolution(elt),
    off = offset(elt),
    perc = {x: (res.x * percent), y: (res.y * percent)};

    return {
        y1: off.y + perc.y,
        y2: res.y + off.y - perc.y
    }

}

class TypeWriter{
    playing = false;
    ended = false;
    index = 0;
    delay = 0;
    speed = 50;
    content = "";
    isContinuous = false;

    /**
     * 
     * @param {{elt: HTMLElement, speed: number|undefined, isContinuous: Boolean|undefined}} param 
     */
    constructor(param){
        // console.log(param)
        if(!param.elt) throw("Element for typewriting missing");
        this.elt = param.elt;
        this.speed = param.speed?param.speed:this.speed;
        this.isContinuous = param.isContinuous?param.isContinuous:this.isContinuous;
        this.refresh();
        this.elt.textContent = "";
        this.init();
    }

    init(){
        this.elt.onmousedown = this.speedup.bind(this)
        this.elt.onmouseup = this.clear_speedup.bind(this)

        this.elt.ontouchstart = this.speedup.bind(this)
        this.elt.ontouchend = this.clear_speedup.bind(this)
    }

    disinit(){
        this.elt.onmousedown = null
        this.elt.onmouseup = null

        this.elt.ontouchstart = null
        this.elt.ontouchend = null
    }

    speedup(){
        this.downInterval = setInterval(
        ()=>{
            this.speed /= 1.25;
        }, 300) 
    }

    clear_speedup(){
        clearInterval(this.downInterval); 
    }

    refresh(){
        this.speed = (this.elt.dataset?.speed)?Number(this.elt.dataset.speed):this.speed;
        this.delay = (this.elt.dataset?.delay)?Number(this.elt.dataset.delay):this.delay;
        this.content = (this.elt.dataset?.content)?String(this.elt.dataset.content):this.elt.textContent;
        this.isContinuous = (!!this.elt.dataset?.cts)?true:this.isContinuous;
    }

    typewrite(){
        // console.log(this.loaded, this.playing)
        if(!this.playing || this.ended) {this.clear_speedup();return};
        if(this.index==0){
            this.dOut = setTimeout(this.animate.bind(this), this.delay)
        }else{
            this.animate();
        }
    }

    animate(){
        if(this.dOut) delete this.dOut;
        this.playing = true;
        if (this.index < this.content.length) {
            this.elt.textContent += this.content.charAt(this.index);
            this.index++;
            setTimeout(()=>{this.typewrite()}, this.speed);
        }else{
            this.clear_speedup();
            this.stop()
        }
    }

    stop(){
        this.refresh();
        this.index = 0;
        this.ended = true
        this.pause();

        this.elt.classList.remove('no-select', 'user-select-none');

        this.disinit();
    }
    /**
     * @param {Function} cb
     */
    set CB (cb){
        this.callback = cb;
    }

    pause(){
        if(this.dOut) {clearTimeout(this.dOut); delete this.dOut;}
        this.playing = false;
    }

    reset(){
        this.playing = false;
        this.ended = false;
        this.index = 0;
        
        let txt = this.content;
        this.refresh();
        this.content = txt;

        this.elt.textContent = "";
        // this.init();
    }

}

class TW_Manager{
    speed = 50;
    data = [];
    classname = "typewrite";
    body = document.body;
    // bounded = this.bound;

    /**
     * 
     * @param {{class: string|undefined, body:HTMLElement|undefined, speed: number|undefined, isContinuous:Boolean|undefined}} param
     * @description class is the class of the elements to be targetted. Default = 'typewrite'
     * @description body: the element which scroll is to be read incase a non continuous typewritting is present. Default = document.body
     * @description speed: default delay interval between each character when typing. Default = 50
     * @description isContinuous: determines if every typewritter is continuous by default. Default = false;
    */
    constructor(param){
        if(param){
            this.classname = (param.class)?param.class:this.classname;
            this.body = (param.body)?param.body:this.body;
            this.speed = (param.speed)?param.speed:this.speed;
            this.isContinuous = param.isContinuous?param.isContinuous:false;
        }
        this.init();
    }

    init(){
        this.elt = document.querySelectorAll("."+this.classname); //overwrite to get diff class

        this.elt.forEach(element => {
            this.data.push(new TypeWriter({
                elt: element,
                speed: this.speed,
                isContinuous: this.isContinuous
            }));
        });
        this.scrollchecker();


        this.body.addEventListener('scroll', this.scrollchecker.bind(this));
        //this.body.addEventListener('wheel', this.scrollchecker.bind(this));
    }

    get resolution(){
        return resolution(this.body);
    }
    get position(){
        return position(this.body);
    }
    get offset(){
        return offset(this.body);
    }
    get bound(){
        let res = this.resolution,
        pos = this.position,
        off = this.offset;

        return {
            y1: pos.y + off.y,
            y2: pos.y + res.y + off.y
        }
    }

    /**
     * @description reloads typing animations for already stored elements
     */
    reload(){
        this.data.forEach((element)=>{
            element.reset();
        })
    }

    /**
     * @description restarts starts animation 
     * @description trashes all registered elements and fetches elements back
     * @description This helps incase elements' classes have been updated and you want to only get the right elements 
     */
    reset(){
        this.data.forEach((element)=>{
            element.pause();
            element.disinit();
        })
        
        delete this.data;
        this.data = [];
        this.init();
    }

    scrollchecker(){
        let bodybound = this.bound;

        this.data.forEach(element => {
            if(! (element instanceof TypeWriter)) throw "An instance of TypeWriter needed";
            let elt = element.elt,
            eltbound = bound(elt, 10);
           // console.log(eltbound)

            if( (bodybound.y2>eltbound.y1) && (eltbound.y2 > bodybound.y1) ) {
                if(!element.playing){
                    element.playing = true; 
                    element.typewrite();
                }
            }else{
              //console.log("element not visible:", element)
              if(element.elt.id=="ace") console.log(bodybound, eltbound)
              if(!element.isContinuous) 
                element.pause();
              else{
                if(!element.playing){
                  element.playing = true;
                  element.typewrite()
                }
              }
            }
        });
    }
}
