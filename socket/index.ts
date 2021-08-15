import { Server } from 'http';
import socketIo from 'socket.io';
import { onlineHandler } from './events/onlineHandler';
import { SessionRepository } from './repository';

export class SocketInstance {
    private io: SocketIO.Server;
    private sessionRepository = new SessionRepository();
    constructor(server: Server) {
        this.sockets(server);
        this.clearSessions();
        this.listen();
    }

    private sockets(server: Server): void {
        this.io = socketIo(server);
    }

    private listen(): void {
        onlineHandler(this.io, this.sessionRepository);
    }
    private async clearSessions() {
        await this.sessionRepository.clearSessions();
    }

    get socketInstance() {
        return this.io;
    }
}
