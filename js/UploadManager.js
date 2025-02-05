import Eventbus from "./Eventbus.js";

export default class UploadManager {
    eventbus = new Eventbus();
    constructor(mediaPreview, concurrentUploads = 1) {
        this.files = [];
        this.activeUploads = 0;
        this.isPaused = false;
        this.concurrentUploads = concurrentUploads;
        this.uploadInterval = 3600000; // 1 hour
        this.minChunkSize = 1024; // 1KB
        this.maxChunkSize = 1024 * 1024 * 10; // 10MB
        this.mediaPreview = mediaPreview;

        // Set up periodic cleanup every hour
        // setInterval(() => this.cleanUpIncompleteUploads(), this.uploadInterval);
    }

    addFile(file, initialChunkSize = 1024 * 512) { // 512KB default initial chunk size
        const reader = new FileReader();
        reader.onload = () => {
            this.files.push({
                file,
                chunkSize: initialChunkSize,
                fileData: reader.result,
                start: 0,
                completed: false,
                isUploading: false,
                lastUploadTime: Date.now(),
                uploadStartTime: null,
            });
            this.mediaPreview.addPreview(file);
        };
        reader.readAsDataURL(file);
    }

    async uploadFile(fileObj) {
        while (!fileObj.completed && !this.isPaused) {
            const startTime = Date.now();

            try {
                await new Promise((resolve, reject) => {
                    const chunk = fileObj.fileData.slice(fileObj.start, fileObj.start + fileObj.chunkSize);
                    const base64Chunk = chunk.split(',')[1]; // Strip off the data URL prefix

                    ajaxRequest({
                        url: 'http://localhost:3000/upload',
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        data: JSON.stringify({
                            filePath: `uploads/${fileObj.file.name}`,
                            chunk: base64Chunk,
                            start: fileObj.start,
                        }),
                        success: (response) => {
                            const endTime = Date.now();
                            const timeTaken = endTime - startTime;

                            fileObj.start += fileObj.chunkSize;
                            fileObj.lastUploadTime = Date.now();

                            if (fileObj.start >= fileObj.fileData.length) {
                                fileObj.completed = true;
                            }

                            // Adjust chunk size based on upload speed
                            this.adjustChunkSize(fileObj, timeTaken);

                            resolve();
                        },
                        error: (xhr, status, error) => {
                            console.error('Upload failed, retrying...', error);
                            reject();
                        }
                    });
                });
            } catch (error) {
                break;
            }
        }
        this.activeUploads--;
        this.uploadNextFile();
    }

    adjustChunkSize(fileObj, timeTaken) {
        const uploadSpeed = fileObj.chunkSize / timeTaken; // Bytes per millisecond

        if (uploadSpeed > 0.5 && fileObj.chunkSize < this.maxChunkSize) {
            // Increase chunk size if upload speed is fast
            fileObj.chunkSize = Math.min(fileObj.chunkSize * 2, this.maxChunkSize);
        } else if (uploadSpeed <= 0.5 && fileObj.chunkSize > this.minChunkSize) {
            // Decrease chunk size if upload speed is slow
            fileObj.chunkSize = Math.max(fileObj.chunkSize / 2, this.minChunkSize);
        }

        console.log(`Adjusted chunk size for ${fileObj.file.name} to ${fileObj.chunkSize} bytes`);
    }

    startUploads() {
        this.isPaused = false;
        while (this.activeUploads < this.concurrentUploads) {
            this.uploadNextFile();
        }
    }

    pauseUploads() {
        this.isPaused = true;
    }

    resumeUploads() {
        this.isPaused = false;
        this.startUploads();
    }

    prioritizeFile(fileName) {
        const fileIndex = this.files.findIndex(fileObj => fileObj.file.name === fileName);
        if (fileIndex > -1) {
            const [fileObj] = this.files.splice(fileIndex, 1);
            this.files.unshift(fileObj);
        }
    }

    uploadNextFile() {
        if (this.isPaused || this.activeUploads >= this.concurrentUploads) {
            return;
        }
        const fileObj = this.files.find(fileObj => !fileObj.completed && !fileObj.isUploading);
        if (fileObj) {
            fileObj.isUploading = true;
            this.activeUploads++;
            this.uploadFile(fileObj);
        }
    }

    cleanUpIncompleteUploads() {
        const now = Date.now();
        this.files = this.files.filter(fileObj => {
            if (!fileObj.completed && now - fileObj.lastUploadTime > this.uploadInterval) {
                console.log(`Cleaning up incomplete upload: ${fileObj.file.name}`);
                return false;
            }
            return true;
        });
    }
}