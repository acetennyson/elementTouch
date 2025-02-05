import { serialize } from "./serialize.js";

export default function request(options){
    const xhr = new XMLHttpRequest();
    const method = options.method || 'GET';
    const url = options.url || '';
    const async = options.async !== false; // Defaults to true
    const data = options.data || null;
    const headers = options.headers || {};

    xhr.open(method, url, async);

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

    if(method === 'POST' && !(headers && headers['Content-Type'])) {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        // console.log("SETTTTTTT")
    }

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

    
    xhr.send(
        (data && typeof data=='object' && headers['Content-Type']) ?
        (headers['Content-Type']==='application/json'?
            JSON.stringify(data)
            :(headers['Content-Type']==='application/x-www-form-urlencoded'?
                serialize(data)
                :data
            )
        )
        :data
    );
}