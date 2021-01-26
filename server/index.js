// Criando um servidor para acessar o cors atraves do http do JavaScript

const server = require('http').createServer((request, response) => {
    // dando autorização para os metodos e verbos em http
    response.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',

    })
    response.end('Server teve uma requisição')
})

// ultilizando a biblioteca em socket para acessar o servidor ultilizando as credenciais 
const socketIo = require('socket.io');
const io = socketIo(server, {
    cors: {
        origin: '*',
        credentials: false
    }
})

io.on('connection', socket => {
    console.log('connection', socket.id);
    // Quando o usuario logar ele terar que entrar em uma sala expecifica
    socket.on('join-room', (roomId, userId) => {
        // Adicionar os usuariosna mesma sala
        socket.join(roomId)
        // notificar todos na sala que usuario usuario novo entrou
        socket.to(roomId).broadcast.emit('user-connected', userId)
        // notificar que o usuario saiu da sala
        socket.on('disconnect', () => {
            console.log('disconected!', roomId, userId)
            socket.to(roomId).broadcast.emit('user-disconnected', userId)

        })
    })
})

// startando o servidor com a porta e o endereço 
const startServer = () => {
    const { address, port } = server.address()
    console.info(`Aplicação rodando em ${address}:${port}`)
}

server.listen(process.env.PORT || 3000, startServer)