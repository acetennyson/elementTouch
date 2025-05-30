import AddElement from "../../component/AddElement.js";
import Eventbus from "./Eventbus.js";

export default class MediaPreview {
    constructor(previewContainer) {
        this.previewContainer = document.querySelector(previewContainer);
        this.eventbus = new Eventbus();
    }

    clearPreviews() {
        this.previewContainer.innerHTML = '';
    }

    /**
     * 
     * @param {File} file 
     */
    addPreview(file) {
        // console.log(file)
        const previewItem = document.createElement('div');
        previewItem.classList.add('preview-item', 'border', 'rounded', 'p-2', 'bg-light', 'text-center', 'm-2');

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.classList.add('img-fluid', 'mb-2');
            img.src = URL.createObjectURL(file);
            previewItem.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.classList.add('img-fluid', 'mb-2');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            previewItem.appendChild(video);
        } else {
            const fakePreview = document.createElement('div');
            fakePreview.classList.add('d-flex', 'align-items-center', 'justify-content-center', 'border', 'p-2', 'mb-2');
            fakePreview.textContent = file.name;
            previewItem.appendChild(fakePreview);
        }

        const fileName = document.createElement('p');
        fileName.classList.add('text-truncate');
        fileName.style.maxWidth = '120px';
        fileName.textContent = file.name;
        previewItem.appendChild(fileName);

        AddElement.interact(previewItem, this.eventbus, {additional: file});

        /* previewItem.addEventListener('click', ()=>{
            this.eventbus.dispatch('clicked', previewItem, file);
        }); */

        this.previewContainer.appendChild(previewItem);
    }
}