import request from "./request.js";

export default class ErrorManager{
    static successCheck(error, additional){
        switch (error.code) {
            case 4:
                window.sessionStorage.clear();
                // console.log($mainDir);
                if($signedIn){
                    window.location.reload();
                }else{
                    // prompt sign in
                    document.querySelector('#hiddenSignin').click();
                }
            break;
    
            default:
                IAmSupreme.notify(error.message, 0);
                break;
        }
    }

    static errorCheck(err){
        if(!err.statusCode) return;
        switch (err.statusCode) {
            case 200:
                
            break;
            case 301:

            break;
            case 404:

            break;
            case 500:

            break;
        
            default:

            break;
        }
    }
}