import mongoose from 'mongoose';

export interface Session extends mongoose.Document {
    login: string;
    ip: string;
    lastAction: number;
    socketId: string;
}

export type SessionEntity = {
    login: string;
    ip: string;
    lastAction: number;
    socketId: string;
};

export const SessionSchema = new mongoose.Schema({
    login: { type: String },
    ip: { type: String },
    lastAction: { type: Number, default: new Date().getTime() },
    socketId: { type: String },
});

export const Session = mongoose.model<Session>('sessions', SessionSchema);
