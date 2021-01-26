const server = require('http').createServer((request, response) => {
    response.writeHead(204, {
        'access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',   

    })
    response.end('Server teve uma requisição')
})

const socketIo = require('socket.io');
const io = socketIo(server, {
    cors: {
        origin: '*',
        creadetials: false
    }
})

io.on('connection', socket => {
    console.log('connection', socket.id);
    socket.on('join-room', (roomId,userId) =>{
        // Adicionar os usuariosna mesma sala
        socket.join(roomId)
        // notificar todos na sala que usuario usuario novo entrou
        socket.to(roomId).broadcast.emit('usuario conectou', userId)
        // notificar que o usuario saiu da sala
        socket.on('disconnect', ()=> {
            console.log('disconected!', roomId, userId)
            socket.to(roomId).broadcast.emit('usuario desconectou',userId)

        })
    })
})

const startServer = () => {
    const {address, port} = server.address()
    console.info(`Aplicação rodando em ${address}:${port}`)
}

server.listen(process.env.PORT || 3000, startServer)