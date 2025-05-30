import Eventbus from "./Eventbus.js";
import MediaPreview from "./MediaPreview.js";

export default class PHPUploadManager {
    /**
     * 
     * @param {string} uploadUrl 
     * @param {MediaPreview} mediaPreview 
     */
    constructor(uploadUrl, mediaPreview) {
        this.uploadUrl = uploadUrl
        this.mediaPreview = mediaPreview;
        this.formData = null;
        this.isUploading = false;
        this.eventbus = new Eventbus();

        this.mediaPreview.eventbus.subscribe('onclick', 
            /**
             * 
             * @param {HTMLDivElement} previewItem 
             * @param {File} file 
             */
            (previewItem, file)=>{
            this.eventbus.dispatch('click', previewItem, file, this.formData)
        });

        this.mediaPreview.eventbus.subscribe('onhold', 
            /**
             * 
             * @param {HTMLDivElement} previewItem 
             * @param {File} file 
             */
            (previewItem, file)=>{
            this.eventbus.dispatch('hold', previewItem, file, this.formData)
        });

        this.mediaPreview.eventbus.subscribe('dblclick', 
            /**
             * 
             * @param {HTMLDivElement} previewItem 
             * @param {File} file 
             */
            (previewItem, file)=>{
            this.eventbus.dispatch('dblclick', previewItem, file, this.formData)
        });

        this.eventbus.subscribe('success', (response)=>{
            this.isUploading = false;
            if(!response.error) {
                this.form?.reset();
                this.mediaPreview.clearPreviews();
            }
        });

        this.eventbus.subscribe('error', (xhr, t)=>{
            this.isUploading = false;
            if(t>3) return;
            this.uploadNext(++t);
        })
    }

    /**
     * 
     * @param {HTMLFormElement} form 
     */
    updateForm(form=this.form) {
        this.form = form;
        if(form) this.formData = new FormData(form);
    }
    
    preview(file){
        this.mediaPreview.addPreview(file);
        IAmSupreme.notify(`${file.name} has been added`, 1);
    }

    resumeUploads(){
        this.isUploading = false;
        this.startUpload();
    }

    pauseUploads(){
        this.isUploading = true;
    }

    uploadNext(t=0){
        if(this.isUploading){
            IAmSupreme.notify('ongoingUpdate', 0);
            // eventbus.dispatch('ongoingUpload');
            return;
        }
        if(!t) this.updateForm();
        if(!this.formData) {
            // eventbus.dispatch('noUpload');
            this.isUploading = false;
            IAmSupreme.notify('no file to upload', 0);
            return;
        }
        this.isUploading = true;

        var xhr = new XMLHttpRequest();
        // console.log(this);
        xhr.open('POST', `${this.uploadUrl}`, true);
        xhr.onload = ()=>{
            let contentType = xhr.getResponseHeader('Content-Type'),
            response = xhr.responseText;
                
            if(contentType){
                if(contentType.includes('application/json')){
                    response = JSON.parse(response);
                }else if(contentType.includes('application/xml')) {
                    response = xhr.responseXML;
                }
            }

            if (xhr.status >= 200 && xhr.status < 300) {
                this.isUploading = false;
                this.eventbus.dispatch('success', response);   
            } else {
                this.eventbus.dispatch('error', xhr, t);
            }

        }
    
        xhr.send(this.formData)
    }

    startUpload() {
        if(!this.isUploading) this.uploadNext();
    }
}