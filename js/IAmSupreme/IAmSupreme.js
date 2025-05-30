(function (global, factory) {
    typeof exports === "object" && typeof module !== "undefined"
        ? (module.exports = factory())
        : typeof define === "function" && define.amd
        ? define(factory)
        : ((global =
              typeof globalThis !== "undefined" ? globalThis : global || self),
          (global.IAmSupreme = factory()));
})(this, function () {
    "use strict";
    const version = "1.0.0";
    class TerminalComponent {
        script = document.createElement("script");
        style = document.createElement("style");
        disp = document.createElement("div");
        editor = {
            html: { string: "", is: true },
            css: { string: "", is: true },
            js: { string: "", is: true },
            console: { string: "", is: true }
        };
        oldst = null;
        selected(string) {
            let oldtxtarea = document.querySelector(`#ng${this.oldst}`);
            if (oldtxtarea && this.editor[this.oldst]) {
                this.editor[this.oldst].string = oldtxtarea.value;
                //console.log(oldtxtarea.value);
            }
            this.oldst = string;
            //console.log(oldtxtarea, this.oldst)
            E(".console").addClass("hide");
            E(`#ng${string}`).removeClass("hide");
        }
        logs = [];
        constructor() {}
        select(s) {
            this.selected(s);
            const framecon = document.getElementById("container_con");

            if (!framecon) {
                console.error("Terminal not Found", framecon);
                return;
            }
            framecon.innerHTML = "";
        }
        run() {
            this.logs = [];
            this.style = document.createElement("style");
            let prescript = document.createElement("script");
            this.script = document.createElement("script");
            this.disp = document.createElement("div");
            const terminal = document.createElement("iframe");
            // terminal.setAttribute("frameborder", "0");
            terminal.setAttribute("id", "console");
            // terminal.setAttribute("isContentEditable", "true");
            terminal.setAttribute("name", "result");
            // terminal.width = "100%";
            // terminal.height = "410px";
            terminal.setAttribute("allowfullscreen", "true");
            this.select("run");
            const framecon = document.getElementById("container_con");

            if (!framecon || !terminal) {
                console.error("Terminal not Found", framecon, terminal);
                return;
            }
            framecon.innerHTML = "";
            framecon.appendChild(terminal);
            // terminal.getElementById
            const frame = terminal.contentWindow?.document
                ? terminal.contentWindow.document
                : terminal.contentDocument;
            if (!frame) {
                console.error("Terminal Frame not found", frame);
                return;
            }
            this.style.innerHTML = this.editor.css.string;
            prescript.innerHTML = `console.stdlog = console.log.bind(console);
    console.logs = [];
    console.log = function(){
      console.logs.push({type:0, text:Array.from(arguments)});
      // console.stdlog.apply(console, arguments);
    }
    console.warn = function(){
      console.logs.push({type:1, text:Array.from(arguments)});
      // console.stdlog.apply(console, arguments);
    }
    console.error = function(){
      console.logs.push({type:2, text:Array.from(arguments)});
      // console.stdlog.apply(console, arguments);
    }`;
            this.script.innerHTML = `try{ ${this.editor.js.string} }catch(e){console.error(e);}`;
            this.disp.innerHTML = this.editor.html.string;
            //console.log("terminal.contentWindow", terminal.contentWindow);
            let aaa =
                this.style.outerHTML +
                prescript.outerHTML +
                this.disp.outerHTML +
                this.script.outerHTML;
            //console.log(aaa)

            frame.open();
            frame.write(aaa);
            frame.close();
            // console.log("TITLE", terminal.contentWindow?.document.title);
            //terminal.contentWindow.onloaded=()=>{
            this.logs = Array.from(terminal.contentWindow.console.logs);
            let c = "";
            for (let log of this.logs) {
                c += `<div class='logs mt-1 mb-1 ${
                    log.type == 2
                        ? "bg-danger-subtle text-danger"
                        : log.type == 1
                        ? "bg-warning-subtle text-warning"
                        : ""
                }'>${log.text}</div>`;
            }
            document.querySelector("#logger").innerHTML = c;
            console.log(c);
            //}
        }

        regexpr(string, pattern) {
            return new RegExp(string, pattern);
        }
    }

    class Dropdown {
        dropdown = document.createElement("div");
        options = {};
        events = {
            input: [],
            mouseover: [],
            change: []
        };
        active = false;
        selected = null;
        type = 0;

        constructor(string, values, t = 0) {
            let base,
                overlay,
                valContainer,
                opts = [];
            (base = document.createElement("div")).classList.add("base");
            base.textContent = string;
            this.type = t;

            Object.keys(values).forEach(key => {
                let opt;
                (opt = document.createElement("div")).classList.add("value");
                opt.textContent = key;
                opt.dataset.value = values[key];
                opts.push(opt);
            });

            overlay = document.createElement("div");
            overlay.append((valContainer = document.createElement("div")));
            valContainer.append(...opts);
            overlay.classList.add("overlay");
            valContainer.classList.add("valContainer");

            this.dropdown.classList.add("dropdown");
            this.dropdown.append(base, overlay);

            this.init();
        }
        addOption(values) {
            let opts = [];
            Object.keys(values).forEach(key => {
                let opt;
                if (Object.keys(this.options).includes(key))
                    throw "key " + key + " already present in Dropdown option";
                (opt = document.createElement("div")).classList.add("value");
                opt.textContent = key;
                this.options[key] = values[key];
                opt.dataset.value = values[key];
                opt.addEventListener("click", this.handlerB.bind(this));

                opts.push(opt);
            });

            this.dropdown.querySelector(".valContainer")?.append(...opts);
        }
        handlerA() {
            this.active = !this.active;
            this.active
                ? this.dropdown.classList.add("clicked")
                : this.dropdown.classList.remove("clicked");
        }
        handlerB(e) {
            if (this.active) {
                let old = this.selected;
                this.dropdown.dataset.value = e.target.dataset.value;
                this.selected = e.target.dataset.value;
                this.dropdown.querySelector(".base").textContent =
                    e.target.textContent;

                //events
                if (this.events.input.length) {
                    for (let i = 0; i < this.events.input.length; i++) {
                        const cb = this.events.input[i];
                        cb(this.selected);
                    }
                }
                if (this.events.change.length && old != this.selected) {
                    for (let i = 0; i < this.events.change.length; i++) {
                        const cb = this.events.change[i];
                        cb({ oldValue: old, newValue: this.selected });
                    }
                }
            }
        }
        addEventListener(event, cb) {
            if (this.events[event]) {
                this.events[event].push(cb);
            } else {
                this.events[event] = [cb];
            }
        }
        removeEventListener(event, cb) {
            if (this.events[event]) {
                this.events[event] = this.events[event].filter(c => c != cb);
            }
        }
        init() {
            //handle click for each dropdown
            this.dropdown.addEventListener("click", this.handlerA.bind(this));

            //handle other events on dropdown element
            Object.keys(this.events).forEach(key => {
                if (key != "input" && key != "change") {
                    this.dropdown.addEventListener(key, ev => {
                        if (this.events[key].length && !this.active) {
                            for (let i = 0; i < this.events[key].length; i++) {
                                const cb = this.events[key][i];
                                console.log(cb);
                                cb(ev);
                            }
                        }
                    });
                }
            });

            //handle selecting value for dropdown
            this.dropdown.querySelectorAll(".value").forEach(val => {
                val.addEventListener("click", this.handlerB.bind(this));
            });
        }

        dis() {
            this.dropdown.removeEventListener(
                "click",
                this.handlerA.bind(this)
            );

            this.dropdown.querySelectorAll(".value").forEach(val => {
                val.removeEventListener("click", this.handlerB.bind(this));
            });

            Object.keys(this.events).forEach(key => {
                if (key != "input" && key != "change") {
                    this.dropdown.removeEventListener(key, ev => {
                        if (this.events[key].length && !this.active) {
                            for (let i = 0; i < this.events[key].length; i++) {
                                const cb = this.events[key][i];
                                console.log(cb);
                                cb(ev);
                            }
                        }
                    });
                }
            });
        }

        get Element() {
            return this.dropdown;
        }
    }

    class DragElement {
        elt = null; // the element to move
        thandle = null; // the elements handle
        mouse = { x: 0, y: 0 }; // the position of your cursor on the screen
        offset = { x: 0, y: 0 }; // the position of your cursor on the element or its handle
        t = false; // the drag method you prefer (either moveE or move2E)
        disabled = false;
        wait = true;
        timeout = 3000;
        parent = document;
        timer = null;

        constructor(element, parent, timeout, t) {
            this.t = t;
            this.timeout = timeout && timeout > 100 ? timeout : this.timeout;
            this.elt =
                typeof element == "string"
                    ? document.getElementById(element)
                    : element;
            let p =
                typeof parent == "string"
                    ? document.getElementById(parent)
                    : null;
            if (!this.elt) throw element;
            this.handle = document.getElementById(this.elt.id + "-handle");
            this.parent = p ? p : document;
            console.log("timer", this.timeout);
            this.load();
        }

        load() {
            if (this.handle) {
                this.handle.ontouchstart = this.handle.onmousedown =
                    this.holdE.bind(this);
            } else {
                this.elt.ontouchstart = this.elt.onmousedown =
                    this.holdE.bind(this);
            }
        }

        setElement(element) {
            this.elt =
                typeof element == "string"
                    ? document.getElementById(element)
                    : element;
            this.handle = document.getElementById(this.elt.id + "-handle");
            this.load();
        }
        gettingReady() {
            this.timer = setTimeout(() => {
                this.wait = false;
                this.elt.classList.add("position-absolute");
            }, this.timeout);
        }
        holdE(event) {
            //on touch start
            if (this.disabled) return;
            this.gettingReady();
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
            this.parent.onmousemove = this.parent.ontouchmove = this.t
                ? this.move2E.bind(this)
                : this.moveE.bind(this);
            this.parent.ontouchend = this.parent.onmouseup =
                this.releaseE.bind(this);
            this.elt.onmouseup = this.releaseE.bind(this);
        }

        moveE(event) {
            //first drag algo (the element maintains position from which it has been touched)
            if (this.disabled) {
                this.releaseE();
                return;
            }
            if(this.wait) return;
            this.offset.x =
                this.mouse.x -
                (event.clientX
                    ? event.clientX
                    : event.changedTouches[0].clientX);
            this.offset.y =
                this.mouse.y -
                (event.clientY
                    ? event.clientY
                    : event.changedTouches[0].clientY);

            this.mouse = {
                x: event.clientX
                    ? event.clientX
                    : event.changedTouches[0].clientX,
                y: event.clientY
                    ? event.clientY
                    : event.changedTouches[0].clientY
            };

            this.elt.style.left = this.elt.offsetLeft - this.offset.x + "px";
            this.elt.style.top = this.elt.offsetTop - this.offset.y + "px";
        }

        move2E(event) {
            //second drag algo (the element's top and left position are equal to the y and x coordinate of the touch')
            if (this.disabled) {
                this.releaseE();
                return;
            }
            if(this.wait) return;
            this.mouse = {
                x: event.clientX
                    ? event.clientX
                    : event.changedTouches[0].clientX,
                y: event.clientY
                    ? event.clientY
                    : event.changedTouches[0].clientY
            };

            this.elt.style.left = this.mouse.x + "px";
            this.elt.style.top = this.mouse.y + "px";
        }
        clrt(){
          clearTimeout(this.timer);
        }

        releaseE() {
            this.clrt();
            this.wait = true;
            // on touch end
            this.elt.classList.remove("position-absolute");
            this.parent.onmousemove = this.parent.ontouchmove = null;
            this.parent.ontouchend = this.parent.onmouseup = null;
            this.handle
                ? (this.handle.onmouseup = this.handle.ontouchend = null)
                : null;
            this.elt.onmouseup = this.elt.ontouchend = null;
        }
    }

    class Notify {
        active = false;
        notified = false;
        exist = false;
        constructor() {}
        changeState() {
            this.active = !this.active;
            this.notified = false;
            this.notify();
        }
        setState(b) {
            if (b != this.active) {
                this.active = b;
                this.notified = false;
            }
            this.notify();
            this.exist = !this.exist ? true : this.exist;
        }
        action() {}
        notify() {
            if (!this.notified) {
                this.action();
            }
        }
    }

    class $$ {
        element;
        IASstyle = {};
        constructor(element) {
            // super();
            this.element = element;
        }
        get() {
            return this.element;
        }
        toggleClass(c, n) {
            if (!this.element.length) return;
            if (n) {
                this.element[n].classList.toggle(c);
            } else
                for (let i = 0; i < this.element.length; i++) {
                    this.element[i].classList.toggle(c);
                }
        }
        removeClass(c, n) {
            if (!this.element.length) return;

            if (n) {
                this.element[n].classList.remove(c);
            } else
                for (let i = 0; i < this.element.length; i++) {
                    this.element[i].classList.remove(c);
                }
        }
        addClass(c, n) {
            if (!this.element.length) return;

            if (n) {
                --n;
                this.element[n].classList.add(c);
            } else
                for (let i = 0; i < this.element.length; i++) {
                    this.element[i].classList.add(c);
                }
        }
        set(attribute, value, n) {
            if (!this.element.length) return;

            if (!value) {
                this.unset(attribute, n);
                return;
            }
            if (n) {
                --n;
                this.element[n].setAttribute(attribute, value);
            } else {
                for (let i = 0; i < this.element.length; i++) {
                    this.element[i].setAttribute(attribute, value);
                }
            }
        }
        unset(attribute, n) {
            if (!this.element.length) return;

            if (n) {
                --n;
                if (this.element[n][attribute])
                    this.element[n].removeAttribute(attribute);
            } else
                for (let i = 0; i < this.element.length; i++) {
                    if (this.element[i][attribute])
                        this.element[i].removeAttribute(attribute);
                }
        }
        on(e, callback, n) {
            if (!this.element.length) return;

            if (n) {
                --n;
                this.element[n].addEventListener(
                    e,
                    callback.bind(this.element[n])
                );
            } else
                for (let i = 0; i < this.element.length; i++) {
                    this.element[i].addEventListener(
                        e,
                        callback.bind(this.element[i])
                    );
                }
        }
        disable() {
            if (!this.element.length) return;

            this.unset("disabled");
        }
        delete() {
            if (!this.element.length) return;
            for (let i = 0; i < this.element.length; i++) {
                this.element[i].outerHTML = "";
            }
        }
        style(attribute, value, n) {
            if (!this.element.length) return;
            this.IASstyle[attribute] = value;
            let words = attribute.split("-");
            if (/!important/.test(value)) {
                value = value.split(" ")[0];
                if (n) {
                    --n;
                    this.element[n]["style"].setProperty(
                        attribute,
                        value,
                        "important"
                    );
                } else this.css(attribute, value, "important");
                return;
            }
            if (words.length > 1) {
                for (let i = 1; i < words.length; i++) {
                    let e = words[i];
                    words[i] = e.charAt(0).toUpperCase() + e.slice(1, e.length);
                }
            }
            let property = words.join("");
            if (n) {
                --n;
                this.element[n]["style"][property] = value;
            } else
                for (let i = 0; i < this.element.length; i++) {
                    this.element[i]["style"][property] = value;
                }
        }
        css(attribute, value, addition) {
            if (!this.element.length) return;
            for (let i = 0; i < this.element.length; i++) {
                this.element[i]["style"].setProperty(
                    attribute,
                    value,
                    addition
                );
            }
        }
        hide() {
            if (!this.element.length) return;
            this.css("display", "none", "important");
        }
        show() {
            if (!this.element.length) return;
            this.css("display", "", "important");
        }
    }

    /* document.addEventListener("DOMContentLoaded",()=>{
    let lists = document.querySelectorAll(".smooth");
    let snackBar = lists[lists.length];
}) */

    const createSnackbar = (
        message,
        type,
        milliseconds,
        callbacktrigger,
        callback
    ) => {
        let snackbar = document.createElement("div");
        snackbar.className = "smooth";
        document.body.append(snackbar);
        snackbar.innerHTML = type
            ? `<div class="alert alert-info">
    <strong></strong> ${message}<a class="triggercallback">${
        callbacktrigger ? callbacktrigger : ""
    }</a>
  </div>`
            : `<div class="alert alert-warning">
    <strong></strong> ${message}<a class="triggercallback">${
        callbacktrigger ? callbacktrigger : ""
    }</a>
  </div>`;
        if (callback) {
            snackbar
                .querySelector(".triggercallback")
                ?.addEventListener("click", () => {
                    callback();
                });
        }
        snackbar.classList.add("show-bar");
        setTimeout(
            () => {
                snackbar.classList.replace("show-bar", "hide-bar");
                setTimeout(() => {
                    snackbar.outerHTML = "";
                }, 500);
            },
            milliseconds ? milliseconds : 5000
        );
        return snackbar;
    };
    const request = (options) => {
        const xhr = new XMLHttpRequest();
        const method = options.method || 'GET';
        const url = options.url || '';
        const async = options.async !== false; // Defaults to true
        const data = options.data || null;
        const headers = options.headers || {};
    
        xhr.open(method, url, async);

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                let contentType = xhr.getResponseHeader('Content-Type'),
                response = xhr.responseText;
                
                if(contentType){
                    if(contentType.includes('application/json')){
                        response = JSON.parse(response);
                    }else if(contentType.includes('application/xml')) {
                        response = xhr.responseXML;
                    }
                }

                const algorithm = xhr.getResponseHeader('X-Encrypt-Algorithm');
                if (algorithm) {
                    const secretKey = 'your-secret-key'; // Ensure this is the same key used for encryption
                    if (algorithm === 'AES') {
                        const bytes = CryptoJS.AES.decrypt(response, secretKey);
                        response = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                    } else {
                        throw new Error('Unsupported decryption algorithm');
                    }
                }
    
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (typeof options.success === 'function') {
                        options.success(response, xhr.status, xhr);
                    }
                } else {
                    if (typeof options.error === 'function') {
                        options.error(xhr, xhr.status, xhr.statusText);
                    }
                }
            }
        };
    
        xhr.onerror = function() {
            if (typeof options.error === 'function') {
                options.error(xhr, xhr.status, xhr.statusText);
            }
        };

        let d = data;
        if(!options.direct) {
            if (options.headers) {
                for (let key in options.headers) {
                    xhr.setRequestHeader(key, options.headers[key]);
                }
            }
    
            const encrypt = options.encrypt || {};
            if (encrypt.algo) {
                // Include the crypto-js library for client-side encryption
                // Add this in your HTML file:
                // <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js"></script>
                const algorithm = encrypt.algo;
                const secretKey = encrypt.key || 'your-secret-key'; // Ensure this is a secure key and managed securely
    
                if (algorithm === 'AES') {
                    data = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
                } else {
                    throw new Error('Unsupported encryption algorithm');
                }
    
                // Add algorithm info to headers
                if (!options.headers) {
                    options.headers = {};
                }
                options.headers['X-Encrypt-Algorithm'] = algorithm;
            }
    
            /* if(data instanceof Object){
                let con = false;
                Object.keys(da).forEach(element => {
    
                });
            } */
                
            
            if(!(data instanceof FormData)) {
                if(method === 'POST' && !(headers && headers['Content-Type'])) {
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    // console.log("SETTTTTTT")
                }
            }
    
            if(data && headers['Content-Type']){
                d = (headers['Content-Type']==='application/json') ? JSON.stringify(data) : (headers['Content-Type']==='application/x-www-form-urlencoded'?serialize(data):data);
            }
        }else
        console.log(d);
        xhr.send(d);
    }
    const loadDoc = (url, cFunction) => {
        const xhttp = new XMLHttpRequest();
        xhttp.onload = function () {
            cFunction(this);
        };
        xhttp.open("GET", url);
        xhttp.send();
    };
    const E = (s, a) => {
        let element;
        let object = a ? a : document;
        if (typeof s == "string") {
            s = s.trim();
        }
        if (typeof s == "string") {
            element = object.querySelectorAll(s);
        } else {
            element = [s];
        }
        return addElementProp(element);
    };
    const addElementProp = element => {
        let methods = {};
        // if(!element["Symbol(Symbol.toStringTag)"] || element["Symbol(Symbol.toStringTag)"]!="NodeList") return;
        return new $$(element);
    };
    /**
     * @param {object} obj 
     * @param {*} prefix 
     */
    const serialize = (obj, prefix)=>{
        const str = [];
        for (let p in obj) {
            if (obj.hasOwnProperty(p)) {
                const k = prefix?`${prefix}[${p}]`:p,
                v = obj[p];
                str.push( 
                    (v !== null && typeof v === 'object')?
                    serialize(v, k)
                    :`${encodeURIComponent(k)}=${(v || typeof v=='number')?encodeURIComponent(v):''}`
                );
            }
        }
        return str.join("&");
    }
    const serializeForm = function (form) {
        let result = "",
        obj = {};
        
        let inputs = form.querySelectorAll("input");
        for (let i = 0; i < inputs.length; i++) {
            const element = inputs[i];
            let name = element.attributes.getNamedItem("name");
            if (name == null) return;
            result += name.value + "=" + element.value + "&";
            obj[name.value] = element.value;
        }
        let textareas = form.querySelectorAll("textarea");
        for (let i = 0; i < textareas.length; i++) {
            const element = textareas[i];
            let name = element.attributes.getNamedItem("name");
            if (name == null) return;
            result += name.value + "=" + element.value + "&";
            obj[name.value] = element.value;
        }
        let selects = form.querySelectorAll("select");
        for (let i = 0; i < selects.length; i++) {
            const element = selects[i];
            let name = element.attributes.getNamedItem("name");
            if (name == null) return;
            result += name.value + "=" + element.value + "&";
            obj[name.value] = element.value;
        }
        return {string: result, object: obj};
    };
    function scrollNorm(el) {
        if (typeof el == "string") {
            el = document.getElementById(el);
        }
        if (el == null) return;
        el.scrollIntoView();
    }
    const setCookie = (cname, cvalue, sec) => {
        let data;
        const d = new Date();
        // exdays*24*60*60
        d.setTime(d.getTime() + sec * 1000);
        data = {
            value: cvalue,
            exdate: d.getTime()
        };
        data = JSON.stringify(data);
        let expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + data + ";" + expires + ";path=/";
    };

    const getCookie = cname => {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(";");
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            /* while (c.charAt(0) == ' ') {
            c = c.substring(1);
        } */
            c = c.trim();
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return;
    };

    const checkCookie = cname => {
        let user = getCookie(cname);
        if (user) {
            user = JSON.parse(user);
            return user;
        }
        return;
    };
    const deleteCookie = cname => {
        if (!getCookie(cname)) return;
        let data;
        const d = new Date("01 Jan 1970 00:00:00 UTC");
        data = {
            value: undefined,
            exdate: d.getTime()
        };
        data = JSON.stringify(data);
        let expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + data + ";" + expires + ";path=/";
    };

    return {
        notify: createSnackbar,
        request: request,
        Elt: E,
        serialize: serialize,
        serializeForm: serializeForm,
        scrollto: scrollNorm,
        setCookie: setCookie,
        getCookie: getCookie,
        checkCookie: checkCookie,
        deleteCookie: deleteCookie,
        Dropdown: Dropdown,
        DragElement: DragElement
    };
});
