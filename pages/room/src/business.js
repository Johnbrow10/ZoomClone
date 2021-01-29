class Business {

    constructor({ room, media, view, socketBuilder, peerBuilder }) {
        this.media = media;
        this.room = room;
        this.view = view;

        this.peerBuilder = peerBuilder;

        // se o usuario estiver conetado ele faz a build para o servidor que estar rodando por trás 
        this.socketBuilder = socketBuilder;

        this.currentStream = {};
        this.socket = {};
        this.currentPeer = {};

        this.peers = new Map();
        this.usersRecording = new Map();
    }

    // inicializa o controlador businnes com as dependencias e intanciando elas no app.js
    static initialize(deps) {
        const instance = new Business(deps);
        return instance._init();
    }

    // aqui a função init anste de tudo pede permisão do usuario e se
    // ele aceita ela roda a função para acessar a camera do navegador
    async _init() {

        this.view.configureRecordButton(this.onRecordPressed.bind(this))

        this.currentStream = await this.media.getCamera();
        this.socket = this.socketBuilder
            .setOnUserConnected(this.onUserConnected())
            .setOnUserDisconnected(this.onUserDisconnected())
            .build();

        this.currentPeer = await this.peerBuilder
            .setOnError(this.onPeerError())
            .setOnConnectionOpened(this.onPeerConnectionOpened())
            .setOnCallReceived(this.onPeerCallReceived())
            .setOnPeerStreamReceived(this.onPeerStreamReceived())
            .setOnCallError(this.onPeerCallError)
            .setOnCallClose(this.onPeerCallClose)
            .build()


        this.addVideoStream(this.currentPeer.id);

    }

    // A funçao captura o id do usuario apra renderizar as telas de videos de todos os usuarios na chamdada
    addVideoStream(userId, stream = this.currentStream) {
        // Add new recorder a cada usuario que sair da stream comeca uma gravação diferente
        const recorderInstance = new Recorder(userId, stream)
        this.usersRecording.set(recorderInstance.filename, recorderInstance);

        if (this.recordingEnabled) {
            recorderInstance.startRecording()
        }

        const isCurrentId = false;
        this.view.renderVideo({
            userId,
            stream,
            isCurrentId
        })
    }

    // se tiver conecatdo ele retorna o id do usuario atraves do socket.io
    onUserConnected = function () {
        return userId => {
            console.log('user connected', userId);
            this.currentPeer.call(userId, this.currentStream)
        }

    }

    // quando o usuario desconectar da reunião
    onUserDisconnected = function () {
        return userId => {
            console.log('user disconnected', userId);

            // se o id do usuario corresponder a reunião 
            if (this.peers.has(userId)) {
                // então ele pega o id e depois fecha a conexão
                this.peers.get(userId).call.close()
                // entao depois deleta ele da conexao
                this.peers.delete(userId)
            }

            // parar a gravaçao do usuario que saiu da reunião
            this.stopRecording(userId);
            // modifica a quantidades de usuarios na reunião
            this.view.setParticipantes(this.peers.size)
            // e assim remove o elemento quando atualiza os participantes a reunião 
            this.view.removeVideoElement(userId)
        }
    }

    onPeerError = function () {
        return error => {
            console.error('error on peer', error);
        }
    }

    onPeerConnectionOpened = function () {
        return (peer) => {
            console.log('peer ta vivo', peer)
            const id = peer.id
            this.socket.emit('join-room', this.room, id);

        }
    }

    onPeerCallReceived = function () {
        return call => {
            console.log("respondendo uma chamada", call)
            call.answer(this.currentStream)
        }
    }

    onPeerStreamReceived = function () {
        return (call, stream) => {
            const callerId = call.peer;
            this.addVideoStream(callerId, stream)
            this.peers.set(callerId, { call })

            this.view.setParticipantes(this.peers.size)
        }
    }
    // fazendo a remoção da tela quando o usuario desconecta da reunião
    onPeerCallError = function () {
        return (call, error) => {
            console.log('erro ao se conectar', error);

            this.view.removeVideoElement(call.peer)
        }
    }

    onPeerCallClose = function () {
        return (call) => {
            console.log('Chamada fechada', call);

        }
    }

    onRecordPressed(recordingEnabled) {
        this.recordingEnabled = recordingEnabled
        console.log('pressionou!!', recordingEnabled)
        // vai passar por cada usuario e sim continuar para iniciar a gravação
        for (const [key, value] of this.usersRecording) {
            if (this.recordingEnabled) {
                value.startRecording()
                continue;
            }
            this.stopRecording(key)
        }
    }

    // se um usuario sair da call durante uma gravação
    // precisamos parar as gravacoes anteriores dele

    async stopRecording(userId) {
        const usersRecordings = this.usersRecordings;
        for (const [key, value] of usersRecordings) {
            const isContextUser = key.includes(userId);
            if (!isContextUser) continue;

            const rec = value;
            const isRecordingActive = rec.recordingActive;

            if (!isRecordingActive) continue;

            await rec.stopRecording();
        }
    }


}