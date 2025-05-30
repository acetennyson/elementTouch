class ErrorManager{
    static successCheck(error){
        switch (error.code) {
            case 4:
                location.href = `${$mainDir}signin?redirect=${location.href}`;
                break;
    
            default:
                break;
        }
    }
}