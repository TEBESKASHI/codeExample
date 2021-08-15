import { SessionRepository } from '../repository';
import { telegram } from '../../modules/telegram';
export const onlineHandler = (io: SocketIO.Server, sessionRepository: SessionRepository) => {
    io.on('connect', (socket: SocketIO.Socket) => {
        socket.on('online', async ({ login, ip }: { login: string; ip: string }) => {
            const isActive = await sessionRepository.findSession(login);
            if (isActive) {
                if (ip === isActive.ip) {
                    await sessionRepository.updateSession(login);
                    socket.emit('hasActive', false);
                } else {
                    await telegram.sendMessage([`Попытка входа в аккаунт с другого устройства\nIP : ${ip}`]);
                    socket.emit('hasActive', true);
                }
            } else {
                await sessionRepository.createSession(login, ip, socket.id);
                socket.emit('hasActive', false);
            }
        });

        socket.on('disconnect', async () => {
            await sessionRepository.deleteSession(socket.id);
        });
    });
};
