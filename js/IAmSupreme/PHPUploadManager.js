class PHPUploadManager {
    constructor(uploadUrl, mediaPreview) {
        this.uploadUrl = uploadUrl
        this.mediaPreview = mediaPreview;
        this.formData = null;
        this.isUploading = false;
        this.eventbus = new Eventbus();

        this.mediaPreview.eventbus.subscribe('clicked', 
            /**
             * 
             * @param {HTMLDivElement} previewItem 
             * @param {File} file 
             */
            (previewItem, file)=>{
            let $v = confirm(`Are you sure you want to remove ${file.name}`);
            if($v){
                let $b = this.formData.has('app');
                previewItem.remove();
                if(!$b) return;

                let list = this.formData.getAll('app');
                list = list.filter( f=>(f.name!=file.name && f.size!=file.size) );
                this.formData.delete('app');
                if(list.length){
                    list.forEach((element, index) => {
                        if(index==0) this.formData.set('app', element, element.name);
                        else this.formData.append('app', element, element.name);
                    });
                    // document.querySelector('#fileInput').value = list;
                }else
                    document.querySelector('#fileInput').value = null;
                // this.formData.append('app', )
                console.log(this.form.children[0].value)
            }
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
        // Set up periodic cleanup every hour
        // setInterval(() => this.cleanUpIncompleteUploads(), this.uploadInterval);
    }

    /**
     * 
     * @param {HTMLFormElement} form 
     */
    updateForm(form) {
        this.form = form;
        this.formData = new FormData(form);
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

    uploadNext(t=1){
        if(this.isUploading){
            IAmSupreme.notify('ongoingUpdate', 0);
            // eventbus.dispatch('ongoingUpload');
            return;
        }
        if(!this.formData) {
            // eventbus.dispatch('noUpload');
            this.isUploading = false;
            IAmSupreme.notify('no file to upload', 0);
            return;
        }
        this.isUploading = true;

        var xhr = new XMLHttpRequest();
        console.log(this);
        xhr.open('POST', `${mainUrl2}/action.php`, true);
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