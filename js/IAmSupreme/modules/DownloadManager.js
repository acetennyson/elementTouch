export default class DownloadManager {
    constructor() {
        this.files = [];
        this.activeDownloads = 0;
        this.isPaused = false;
        this.concurrentDownloads = 1;
        this.downloadInterval = 3600000; // 1 hour
        this.minChunkSize = 1024; // 1KB
        this.maxChunkSize = 1024 * 1024 * 10; // 10MB

        // Set up periodic cleanup every hour
        setInterval(
            () => this.cleanUpIncompleteDownloads(),
            this.downloadInterval
        );
    }

    addFile(filePath, initialChunkSize = 1024) {
        this.files.push({
            filePath,
            chunkSize: initialChunkSize,
            fileData: "",
            start: 0,
            completed: false,
            isDownloading: false,
            lastDownloadTime: Date.now(),
            downloadStartTime: null
        });
    }

    async downloadFile(file) {
        while (!file.completed && !this.isPaused) {
            const startTime = Date.now();

            try {
                await new Promise((resolve, reject) => {
                    ajaxRequest({
                        url: "http://localhost:3000/download",
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        data: JSON.stringify({
                            filePath: file.filePath,
                            start: file.start,
                            chunkSize: file.chunkSize
                        }),
                        success: response => {
                            const endTime = Date.now();
                            const timeTaken = endTime - startTime;

                            file.fileData += response.chunk;
                            file.start += file.chunkSize;
                            file.lastDownloadTime = Date.now();

                            if (response.chunk.length < file.chunkSize) {
                                file.completed = true;
                                this.createDownloadLink(file);
                            }

                            // Adjust chunk size based on download speed
                            this.adjustChunkSize(file, timeTaken);

                            resolve();
                        },
                        error: (xhr, status, error) => {
                            console.error(
                                "Download failed, retrying...",
                                error
                            );
                            reject();
                        }
                    });
                });
            } catch (error) {
                break;
            }
        }
        this.activeDownloads--;
        this.downloadNextFile();
    }

    adjustChunkSize(file, timeTaken) {
        const downloadSpeed = file.chunkSize / timeTaken; // Bytes per millisecond

        if (downloadSpeed > 0.5 && file.chunkSize < this.maxChunkSize) {
            // Increase chunk size if download speed is fast
            file.chunkSize = Math.min(file.chunkSize * 2, this.maxChunkSize);
        } else if (downloadSpeed <= 0.5 && file.chunkSize > this.minChunkSize) {
            // Decrease chunk size if download speed is slow
            file.chunkSize = Math.max(file.chunkSize / 2, this.minChunkSize);
        }

        console.log(
            `Adjusted chunk size for ${file.filePath} to ${file.chunkSize} bytes`
        );
    }

    createDownloadLink(file) {
        const byteCharacters = atob(file.fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray]);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = file.filePath.split("/").pop();
        link.click();
    }

    startDownloads() {
        this.isPaused = false;
        while (this.activeDownloads < this.concurrentDownloads) {
            this.downloadNextFile();
        }
    }

    pauseDownloads() {
        this.isPaused = true;
    }

    resumeDownloads() {
        this.isPaused = false;
        this.startDownloads();
    }

    prioritizeFile(filePath) {
        const fileIndex = this.files.findIndex(
            file => file.filePath === filePath
        );
        if (fileIndex > -1) {
            const [file] = this.files.splice(fileIndex, 1);
            this.files.unshift(file);
        }
    }

    downloadNextFile() {
        if (this.isPaused || this.activeDownloads >= this.concurrentDownloads) {
            return;
        }
        const file = this.files.find(
            file => !file.completed && !file.isDownloading
        );
        if (file) {
            file.isDownloading = true;
            this.activeDownloads++;
            this.downloadFile(file);
        }
    }

    cleanUpIncompleteDownloads() {
        const now = Date.now();
        this.files = this.files.filter(file => {
            if (
                !file.completed &&
                now - file.lastDownloadTime > this.downloadInterval
            ) {
                console.log(
                    `Cleaning up incomplete download: ${file.filePath}`
                );
                return false;
            }
            return true;
        });
    }
}
