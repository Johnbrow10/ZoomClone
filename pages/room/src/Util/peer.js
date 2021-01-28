class PeerBuilder {
    constructor({ peerConfig }) {
        this.peerConfig = peerConfig;

        const defaultFunctionValue = () => { }
        this.onError = defaultFunctionValue;
        this.onCallReceived = defaultFunctionValue;
        this.onConnectionOpened = defaultFunctionValue;
        this.onPeerStreamReceived = defaultFunctionValue;
        this.onCallError = defaultFunctionValue;
        this.onCallClose = defaultFunctionValue;
    }

    // pra saber quando a chamada deu error
    setOnCallError(fn) {
        this.oncallError = fn;

        return this;
    }
    // quando a chamada fechou
    setOnCallClose(fn) {
        this.oncallClose = fn;
        return this;
    }

    setOnError(fn) {
        this.onError = fn;
        return this;
    }

    setOnCallReceived(fn) {
        this.onCallReceived = fn;

        return this;
    }

    setOnConnectionOpened(fn) {
        this.onConnectionOpened = fn;

        return this;
    }

    setOnPeerStreamReceived(fn) {
        this.onPeerStreamReceived = fn;

        return this;
    }

    prepareCallEvent(call) {
        call.on('stream', stream => this.onPeerStreamReceived(call, stream));
        call.on('error', error => this.onCallError(call, error));
        call.on('close', _ => this.onCallClose(call));
        this.onCallReceived(call);
    }

    // ADICIONAR O COMPORTAMENTO DE EVENTOS DA CALL TAMBÉM PARA QUEM LIGAR;
    preparePeerInstanceFunction(peerModule) {
        class PeerCustomModule extends peerModule { }

        const peerCall = PeerCustomModule.prototype.call;
        const context = this;
        PeerCustomModule.prototype.call = function (id, stream) {
            const call = peerCall.apply(this, [id, stream]);

            // aqui acontece a magia , interceptamos o call e adicionamos a todos os eventos
            // da chamada para quem liga também 
            context.prepareCallEvent(call);

            return call;
        }

        return PeerCustomModule;
    }

    build() {

        // const peer = new Peer(...this.peerConfig);

        const PeerCustomInstance = this.preparePeerInstanceFunction(Peer);
        const peer = new PeerCustomInstance(...this.peerConfig);


        peer.on('error', this.onError);
        peer.on('call', this.prepareCallEvent.bind(this));

        return new Promise(resolve => peer.on('open', id => {
            this.onConnectionOpened(peer);
            return resolve(peer);
        }))

    }
}