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

    /**
     * 
     * @param {{elt: HTMLElement, speed: number}} param 
     */
    constructor(param){
        // console.log(param)
        if(!param.elt) throw("Element for typewriting missing");
        this.elt = param.elt;
        this.speed = param.speed;
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
    }

    typewrite(){
        // console.log(this.loaded, this.playing)
        if(!this.playing || this.ended) {this.clear_speedup();return};
        if(this.index==0){
            setTimeout(this.animate.bind(this), this.delay)
        }else{
            this.animate();
        }
    }

    animate(){
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

        this.elt.onmousedown = null
        this.elt.onmouseup = null

        this.elt.ontouchstart = null
        this.elt.ontouchend = null
        // if(this.callback) this.callback();
    }
    /**
     * @param {Function} cb
     */
    set CB (cb){
        this.callback = cb;
    }

    pause(){
        this.playing = false;
    }

}

class TW_Manager{
    speed = 50;
    data = [];
    classname = "typewrite";
    body = document.body;
    // bounded = this.bound;

    constructor(param){
        if(param){
            this.classname = (param.class)?param.class:this.classname;
            this.body = (param.body)?param.body:this.body;
            this.speed = (param.speed)?param.speed:this.speed;
        }
        this.init();
    }
    
    init(){
        elt = document.querySelectorAll("."+this.classname); //overwrite to get diff class

        this.elt.forEach(element => {
            this.data.push(new TypeWriter({
                elt: element,
                speed: this.speed,
            }));
        });

        document.body.addEventListener('scroll', this.scrollchecker.bind(this));

        this.scrollchecker();
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

    scrollchecker(){
        let bodybound = this.bound;

        this.data.forEach(element => {
            if(! (element instanceof TypeWriter)) return;
            let elt = element.elt,
            eltbound = bound(elt, 10);
            
            if( (bodybound.y2>eltbound.y1) && (eltbound.y2 > bodybound.y1) ) {
                if(!element.playing){
                    element.playing = true; 
                    element.typewrite();
                }
            }else{
                element.pause();
            }
        });
    }
}
var ace = new TW_Manager({speed: 80});