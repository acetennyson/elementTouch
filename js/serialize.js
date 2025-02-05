/**
 * 
 * @param {{[index:string]: any}} obj 
 * @param {string|undefined} prefix 
 * @returns {string}
 */
export const serialize = (obj, prefix)=>{
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

/**
 * 
 * @param {HTMLFormElement} form  
 */
export const serializeForm = function (form) {
    let result = "",
    obj = {};
    
    let inputs = form.querySelectorAll("input");
    for (let i = 0; i < inputs.length; i++) {
        const element = inputs[i];
        let name = element.attributes.getNamedItem("name");
        if (!name) continue;
        result += name.value + "=" + element.value + "&";
        obj[name.value] = element.value;
    }
    let textareas = form.querySelectorAll("textarea");
    for (let i = 0; i < textareas.length; i++) {
        const element = textareas[i];
        let name = element.attributes.getNamedItem("name");
        if (!name) continue;
        result += name.value + "=" + element.value + "&";
        obj[name.value] = element.value;
    }
    let selects = form.querySelectorAll("select");
    for (let i = 0; i < selects.length; i++) {
        const element = selects[i];
        let name = element.attributes.getNamedItem("name");
        if (!name) continue;
        result += name.value + "=" + element.value + "&";
        obj[name.value] = element.value;
    }
    return {string: result, object: obj};
};