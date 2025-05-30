import Eventbus from "./Eventbus.js";

export class PopOverManager {
    elts = []
    triggers = []
    constructor(selector, popovertriggers=[], popoverlist=[]) {
        this.selector = selector;
        this.triggers = popovertriggers;
        this.elts = popoverlist;
    }

    refresh(){
        var popoverTriggerList = [].slice.call(document.querySelectorAll(this.selector))
        .filter(poptrigger=>{
            return !this.triggers.includes(poptrigger)
        }),
        popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl)
        })

        this.triggers = [...this.triggers, ...popoverTriggerList];
        this.elts = [...this.elts, ...popoverList];
        // console.log(this)
    }
}


export class ToastManager {
    elts = []
    toasts = []
    triggers = []
    /**
     * @param {{trigger: string|Element, toast: string}[]} elts 
     */
    constructor(elts=[{trigger: '#toastbtn', toast: '.toast'}]) {
        this.refresh(elts);
    }

    /**
     * @param {{trigger: string|Element, toast: string}[]} elts 
     */
    refresh(elts){
        elts = elts.map((v)=>{
            v.toast = [].slice.call(document.querySelectorAll(v.toast));
            v.trigger = (typeof v.trigger == 'string')?document.querySelectorAll(v.trigger):[v.trigger];
            return v;
        })
        elts = elts.filter((v)=>{
            let result = false;
            v.trigger.forEach(trig=>{
                result = this.triggers.includes(trig);
                if(result) return;
                trig.addEventListener('click', (event)=>{
                    var toastList = v.toast.map((toastEl)=>{
                        if( !this.toasts.includes(toastEl) ){
                            this.toasts.push(toastEl);
                        }
                        return new bootstrap.Toast(toastEl)
                    })
                    toastList.forEach(toast => toast.show())  
                })
                this.triggers.push(trig);
                
            })

            return result;
        })

        // this.elts = [...this.elts, ...elts];

    }
}

export class ToastManager2{
    eventbus = new Eventbus();
    constructor(selector){
        this.toasts = document.querySelectorAll(selector);
    }

    setCloser(selector){
        document.querySelector(selector)?.addEventListener('click', ()=>{
            name: "closeAlltoast";
            // console.log('close')
            this.hide();
        })
    }

    show(){
        this.toasts.forEach(toast=>{
            this.showToast(toast);
        })
    }

    /**
     * @param {{[index: string]: any}} props 
     */
    get(props){
        let value = null;
        this.toasts.forEach(toast=>{
            let value2 = true;
            Object.keys(props).forEach(key=>{
                // checks if all props have matching value
                if(props[key]!=toast[key]){
                    value2 = false;
                    return;
                }
            })
            value = value2?toast:null;
            // check if toast gotten;
            if(value2) return value;
        })

        return value;
    }

    hide(){
        this.toasts.forEach(toast=>{
            this.hideToast(toast);
        })
    }

    setTimeout(timeout = 0){
        this.toasts.forEach(toast=>{
            if(timeout > 1000)
                this.setTimeout(() => {
                    this.hideToast(toast);
                }, timeout);
        })
    }

    showToast(toast){
        toast.classList.add('show');
        // toast.style.display = 'block';
    }

    hideToast(toast){
        if(this.eventbus.event['closed']?.length){
            this.eventbus.dispatch('closed', toast);
            return;
        }
        toast.classList.remove('show');
        toast.classList.add('hide');
    }
}

export class ModalManager{
    eventbus = new Eventbus();
    constructor(selector){
        /**
         * @type {HTMLDivElement}
         */
        this.modal = document.querySelector(selector);
        this.dialog = this.modal.querySelector('.modal-dialog');
        this.content = this.modal.querySelector('.modal-content');
        this.modal.querySelectorAll('[data-ias-dismiss="modal"]').forEach(element => {
            this.set(element, false);
        });

        this.modal.addEventListener('click', (e)=>{
            let isModal = e.target.closest('.modal-dialog');

            if(!isModal) {
                this.close();
                return
            }
        })
        this.state = (this.modal.classList.contains('d-block'))?true:false;

        // this.modal.querySelectorAll()
    }

    /**
     * 
     * @param {string | HTMLElement } element 
     * @param {boolean} setState 
     */
    set(element, setState){
        const html = typeof element == 'string'?document.querySelector(element):element;
        html?.addEventListener('click', (e)=>{
            setState?this.open():this.close();
        })
    }

    toggle() {
        this.state?this.close():this.open();
    }

    open(){
        this.state = true;
        if(this.eventbus.event['open']?.length){
            this.eventbus.dispatch('open', this.modal);
            return
        }
        this.modal.classList.remove("hide");
        this.modal.classList.add("d-block");
    }

    close(){
        this.state = false;
        if(this.eventbus.event['close']?.length){
            this.eventbus.dispatch('close', this.modal);
            return
        }
        this.modal.classList.remove("d-block");
        this.modal.classList.add("hide");
    }

}

export class PopOverManager2 {
    constructor(selector, props={}) {
        this.eventbus = new Eventbus();
        this.isHTML = props.hasOwnProperty('isHTML') ? props.isHTML : true;
        this.placement = props.placement || 'top';
        this.title = props.title || 'PopOver Header';
        this.content = props.content || 'Popover body content.';
        this.state = false;
        // this.selector = selector;
        this.init(selector);
    }
    
    init(selector=this.selector){
        this.element = document.querySelector(selector);
        if (this.element) {
            this.element.setAttribute('data-bs-html', `${this.isHTML}`);
            this.element.setAttribute('data-bs-toggle', 'popover');
            this.element.setAttribute('data-bs-placement', this.placement);
            this.element.setAttribute('title', this.title);
            this.element.setAttribute('data-bs-content', this.content);

            this.initEvent(selector);
        }
    }
    
    initEvent(selector) {
        this.element.addEventListener('click', (event) => {
            event.stopPropagation();
            this.toggle();
        });
        
        document.addEventListener('click', (event) => {
            if (this.element && this.popover) {
                this.hide();
            }
        });

        this.popover = bootstrap.Popover.getInstance(this.element) || new bootstrap.Popover(this.element, {
            trigger: "manual"
        });
        // console.log(this.popover)
    }
  
    show() {
        if (this.element && this.popover) {
            this.popover.show();
            this.eventbus.dispatch('open', this.popover)
        }
    }

    get isActive() {
        // console.log(this.popover)
        return this.popover?._getTipElement()?.classList.contains('show');
    }
  
    hide() {
        if (this.element) {
            // const popover = bootstrap.Popover.getInstance(this.element);
            if (this.popover) {
                this.popover.hide();
                this.eventbus.dispatch('close', this.popover)
            }
        }
    }
  
    toggle() {
        if (this.popover) {
            // const popover = bootstrap.Popover.getInstance(this.element);
            if( this.isActive ) {
                this.hide();
            }else{
                this.show();
            }
            // this.popover.toggle();
            // this.eventbus.dispatch(!this.isActive ? 'open' : 'close', this.popover);
            // this.state = !this.state;
        }
    }
  
    dispose() {
        if (this.element) {
            // const popover = bootstrap.Popover.getInstance(this.element);
            if (this.popover) {
                this.popover.dispose();
                delete this.popover;
            }
        }
    }

    setContent(props = {}) {
        // console.log(this.element, this.popover)
        if (this.element) {
            this.title = props.title;
            this.content = props.content;
            
            this.element.setAttribute('title', this.title);
            this.element.setAttribute('data-bs-content', this.content);

            // Manually update the DOM content
            /* const header = this.element.querySelector('.popover-header');
            const body = this.element.querySelector('.popover-body'); */
            
            if (this.popover) {

                this.popover._config.title = this.title;
                this.popover._config.content = this.content;
                
                this.popover.setContent();
            }
        }
    }

    /**
     * 
     * @param {string | HTMLElement} content 
     * @param {string} title 
     */
    showContent(content, title, reset=true){
        if (this.element && this.popover) {
            const body = this.popover.tip.querySelector('.popover-body'),
            header = this.popover.tip.querySelector('.popover-header');
            content = content || this.popover._config.content;
            
            if(body && header){
                if(reset) body.innerHTML = "";
                header.textContent = title || this.title;
                if(this.popover._config.html){
                    if(typeof content == "string"){
                        body.innerHTML = content
                    }else{
                        if(content.tagName)
                            body.appendChild(content);
                    }
                    return;
                }else
                    body.textContent = content;
            }
        }
    }

    /**
     * @param {any} popover
     * @param {string | HTMLElement} content 
     * @param {string} title 
     */
    static showContent(popover, content, title){
        if (popover) {
            const body = popover.tip.querySelector('.popover-body'),
            header = popover.tip.querySelector('.popover-header');
            content = content || popover._config.content;
            
            if(body && header){
                body.innerHTML = "";
                header.textContent = title || popover._config.title;
                if(popover._config.html){
                    if(typeof content == "string"){
                        body.innerHTML = content
                    }else{
                        if(content.tagName)
                            body.appendChild(content);
                    }
                    return;
                }else
                    body.textContent = content;
            }else{
                console.warn("PopOver Error")
            }
        }
    }
}
  
/*   // Usage example:
  const popOverManager = new PopOverManager('#myPopover');
  popOverManager.show(); // Show the popover
  popOverManager.hide(); // Hide the popover
  popOverManager.toggle(); // Toggle the popover
  popOverManager.dispose(); // Dispose of the popover
   */