class Business {

    constructor({ room, media, view, socketBuilder }) {
        this.media = media;
        this.room = room;
        this.view = view;

        // se o usuario estiver conetado ele faz a build para o servidor que estar rodando por trás 
        this.socketBuilder = socketBuilder
            .setOnUserConnected(this.onUserConnected())
            .build();

        this.socketBuilder.emit('join-room', this.room, 'teste01')
        this.currentStream = {}
    }

    // inicializa o controlador businnes com as dependencias e intanciando elas no app.js
    static initialize(deps) {
        const instance = new Business(deps);
        return instance._init();
    }

    // aqui a função init anste de tudo pede permisão do usuario e se
    // ele aceita ela roda a função para acessar a camera do navegador
    async _init() {
        this.currentStream = await this.media.getCamera();
        console.log('init!!', this.currentStream)

        this.addVideoStream('teste01');

    }

    // A funçao captura o id do usuario apra renderizar as telas de videos de todos os usuarios na chamdada
    addVideoStream(userId, stream = this.currentStream) {
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
        }
    }

    onUserDisconnected = function () {
        return userId => {
            console.log('user disconnected', userId);
        }
    }

}