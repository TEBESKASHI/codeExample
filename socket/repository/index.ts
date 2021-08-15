import { Session } from '../entity';

export class SessionRepository {
    createSession(login: string, ip: string, socketId: string) {
        return Session.create({ login, ip, lastAction: new Date().getTime(), socketId });
    }
    updateSession(login: string) {
        return Session.updateOne({ login }, { lastAction: new Date().getTime() });
    }
    deleteSession(socketId: string) {
        return Session.deleteOne({ socketId });
    }
    findSession(login: string) {
        return Session.findOne({ login });
    }
    clearSessions() {
        return Session.deleteMany({});
    }
}
