import { ENV } from '../../etc';
import axios, { AxiosStatic } from 'axios';
import { TelegramUserRepository } from './repository';
import { logger, loggerForFixtures } from '../../etc';

let failMessagesPull = [];

class Telegram {
    static botToken: string = ENV.TELEGRAM_TOKEN;
    static apiLINK: string = `https://api.telegram.org/bot`;
    private telegramUserRepository = new TelegramUserRepository();
    private axios: AxiosStatic;

    constructor(axiosIsntance: AxiosStatic) {
        this.axios = axiosIsntance;
    }

    async sendMessage(text: string[]) {
        const users = await this.telegramUserRepository.getUsers();
        loggerForFixtures.log('info', text.toString());
        const chunks = [...Array(Math.floor(text.length / 3) + 1)]
            .map((_, c) => text.filter((n, i) => (c + 1) * 3 > i && i >= c * 3))
            .filter((e) => e.length);

        // let promises = users.map((user) => {
        //     for (const eventsPack of chunks) {
        //         this.axios
        //             .post(Telegram.apiLINK + Telegram.botToken + `/sendMessage?chat_id=${user.chatId}&text=${encodeURI(eventsPack.join())}`)
        //             .then(() => logger.log('info', eventsPack))
        //             .catch((e) => logger.log('error', e));
        //     }
        // });

        users.map(async (user) => {
            for (const eventsPack of chunks) {
                await this.axios
                    .post(Telegram.apiLINK + Telegram.botToken + `/sendMessage?chat_id=${user.chatId}&text=${encodeURI(eventsPack.join())}`)
                    .then(() => logger.log('info', eventsPack))
                    .catch((e) => logger.log('error', e));
            }
        });

        //@ts-ignore
        // await Promise.allSettled(promises);
    }

    addUser(chatId: string, userId: string) {
        return this.telegramUserRepository.createUser(chatId, userId);
    }
}

export const telegram = new Telegram(axios);

setInterval(async () => {
    if (failMessagesPull.length) {
        await telegram.sendMessage(failMessagesPull);
        console.log(`Попытка отправить повторно сообщения в телеграмм в количчестве ${failMessagesPull.length}`);
    }
}, 15000);
