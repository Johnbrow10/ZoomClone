
const onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get('room');
  console.log('this is the room', room);

  // const socketUrl = 'http://localhost:3000';
  const socketUrl = 'https://rocky-depths-73143.herokuapp.com';
  const socketBuilder = new SocketBuilder({ socketUrl });

  // criando o peerConfig para receber onde roda o servidor do peerjs
  const peerConfig = Object.values({
    id: undefined,
    config: {
      host: 'guarded-dawn-70787.herokuapp.com',
      secure: true,
      // port: 9000,
      // host: 'localhost',
      path: '/'
    }
  })
  const peerBuilder = new PeerBuilder({ peerConfig });


  const view = new View()
  const media = new Media();
  const deps = {
    view,
    media,
    room,
    socketBuilder,
    peerBuilder
  }

  Business.initialize(deps);



}

window.onload = onload;