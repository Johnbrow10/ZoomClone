class Recorder {
    constructor(userName, stream) {
        this.userName = userName;
        this.stream = stream;
        this.filename = `id:${userName}-when:${Date.now()}`;
        this.videoType = 'video/webm';

        this.mediaRecorder = {};
        this.recordedBlobs = [];
        this.completeRecordings = [];
        this.recordingActive = false;
    }

    _setup() {
        const commonCodecs = [
            "codecs=vp9,opus",
            "codecs=vp8,opus",
            "",

        ]

        const options = commonCodecs
            .map(codec => ({ mimeType: `${this.videoType};${codec}` }))
            .find(options => MediaRecorder.isTypeSupported(options.mimeType))

        if (!options) {
            throw new Error(`não tem codecs para esse browser: ${commonCodecs.join(',')} are suported`)
        }

        return options;
    }

    startRecording() {

        const options = this._setup();
        console.log("startou a gravação", this.userName, this.filename)

        // se nao tiver mais video nem grava, ja ignora!!
        if (!this.stream.active) return;
        this.mediaRecorder = new MediaRecorder(this.stream, options)
        console.log(`Criou MediaRecorder ${this.MediaRecorder} e essas são as opções ${options}`)

        this.mediaRecorder.onstop = (event) => {
            console.log("record blobs que foram gravados", this.recordedBlobs);

        }

        this.mediaRecorder.ondataavailable = (event) => {
            // toda vez que o navegador conseguir ir gravando ele ira jogar todos os binarios dentro desse array
            if (!event.data || !event.data.size) return;

            this.recordedBlobs.push(event.data)
        }

        this.mediaRecorder.start();
        console.log(`Media record iniciou!!`, this.mediaRecorder);
        this.recordingActive = true;

    }

    async stopRecording() {
        if (!this.recordingActive) return;
        if (this.mediaRecorder.state === "inactive") return;

        console.log("`media Record pausado!!`", this.userName);

        this.mediaRecorder.stop();
        this.recordingActive = false;

        await Util.sleep(200);
        // da um push para completar o video
        this.completeRecordings.push([...this.recordedBlobs]);
        // e depois de completar tudo no blobs zeramos para comecar uma gravação nova
        this.recordedBlobs = []
    }

    getAllVideoURLs() {
        return this.completeRecordings.map(recording => {
            const superBuffer = new Blob(recording, { type: this.videoType });

            return window.URL.createObjectURL(superBuffer);
        })
    }

    download() {
        if (!this.completeRecordings.length) return;

        for (const recording of this.completeRecordings) {
            const blob = new Blob(recording, { type: this.videoType })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.style.display = 'none'
            a.href = url
            a.download = `${this.filename}.webm`
            document.body.appendChild(a)
            a.click()
        }

    }

}