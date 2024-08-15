
class CodeEditor {
    script = document.createElement("script");
    style = document.createElement("style");
    disp = document.createElement("div");
    hook = {
        html: {trigger: null, anchor: null},
        css: {trigger: null, anchor: null},
        js: {trigger: null, anchor: null},
        console: {output: null},
        run: {trigger: null, anchor: null},
    }
    editor = {
        html: { string: "", is: true },
        css: { string: "", is: true },
        js: { string: "", is: true },
    };
    oldst = null;
    logs = [];

    /**
     * 
     * @param {{html: {trigger: string|Element, anchor: string|Element}, css: {trigger: string|Element, anchor: string|Element}, js: {trigger: string|Element, anchor: string|Element}, console: {output: string|Element}, run: {trigger: string|Element, anchor: string|Element}}} hook 
     * @description trigger triggers the section to display
     * @description anchor fetches data on the section
     * @description (for display areas like run and console) output displays data on that section
     */
    constructor(hook) {
        if(!hook) throw 'constructor lacking parameter';
        
        Object.keys(hook).forEach(name => {
            Object.keys(hook[name]).forEach(type => {
                this.hook[name][type] = CodeEditor.returnElement(hook[name][type]);
            })

            if(this.hook[name].trigger && name!='console'){
                this.hook[name].trigger.onclick = ()=>{
                    this.select(name);
                }
                this.hook[name].anchor.style.display = 'none';
            }

        });
    }

    /**
     * @param {string | Element} param 
     */
    static returnElement(param){
        
        return (typeof param == 'string') ? document.querySelector(`#${param}`) : param;
    }

    /**
     * @param {string} name 
     * @description
     */
    selected(name) {
        
        if (this.oldst && this.editor[this.oldst]) {
            this.editor[this.oldst].string = this.hook[this.oldst]?.anchor?.value;
        }
        this.oldst = name;
        
        Object.keys(this.hook).forEach(nname => {
            if(this.hook[nname]?.anchor) this.hook[nname].anchor.style.display = "none";
        });
        
        let active = this.hook[name].anchor;
        if(active) active.style.display = 'block';
    }
        
    select(s) {
        if(s!='run' && this.hook.console?.output) this.hook.console.output.style.display = 'none';
        this.selected(s);
        
        if(s=='run') this.run();
    }

    run() {
        this.logs = [];
        this.style = document.createElement("style");
        let prescript = document.createElement("script");
        this.script = document.createElement("script");
        this.disp = document.createElement("div");
        const terminal = document.createElement("iframe");
        // terminal.setAttribute("frameborder", "0");
        // terminal.setAttribute("isContentEditable", "true");
        // terminal.width = "100%";
        // terminal.height = "410px";
        terminal.setAttribute("id", "console");
        terminal.setAttribute("name", "result");
        terminal.setAttribute("allowfullscreen", "true");

        const framecon = this.hook.run.anchor;

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
        prescript.innerHTML = `
            console.stdlog = console.log.bind(console);
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
            }
        `;
        this.script.innerHTML = `try{ ${this.editor.js.string} }catch(e){console.error(e);}`;
        this.disp.innerHTML = this.editor.html.string;
        
        let aaa =
            this.style.outerHTML +
            prescript.outerHTML +
            this.disp.outerHTML +
            this.script.outerHTML;

        frame.open();
        frame.write(aaa);
        frame.close();
        
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
        if(this.hook.console?.output && this.logs.length) {
            this.hook.console.output.innerHTML = c;
            this.hook.console.output.style.display = 'block'
        }
        console.log(c);
        //}
    }

    regexpr(string, pattern) {
        return new RegExp(string, pattern);
    }
}