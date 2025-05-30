class PopoverManager {
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


class ToastManager {
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

class ToastManager2{
    constructor(selector){
        this.toasts = document.querySelectorAll(selector);
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

    setTimeout(timeout){
        this.toasts.forEach(toast=>{
            this.setTimeout(() => {
                this.hideToast(toast);
            }, timeout);
        })
    }

    showToast(toast){
        toast.classList.add('show');
        toast.style.display = 'block';
    }

    hideToast(toast){
        toast.classList.remove('show');
        toast.style.display = 'none';
    }
}