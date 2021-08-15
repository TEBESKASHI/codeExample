import { UserOptions } from '../../user/interfaces';
import { FirstTableFields, TotalCornerFixtures, TotalCornerLives } from '../entity';
import { Worker } from 'worker_threads';
import path from 'path';
import BetsRepository from '../repository';
import { IndicatorsStats } from '../../betsStats/interfaces';
import { LeagueStatsEntity } from '../../leaguesStats/entity';
import { SelectJsonType } from '../../../workers/interfaces';
import { FiltersType } from '../interfaces/filters';
import { UserEntity } from '../../user/entity';
import { LeaguesStatsFields } from '../../../workers/services/leagueStats';
import { Type } from '../../../common';

let leaguesStatsHolder: LeaguesStatsFields;

export default class BetsService {
    private betsRepository = new BetsRepository();
    async getFirstTableData(databaseName: string) {
        return this.betsRepository.getFirstTableData(databaseName);
    }
    async getLiveTableData(databaseName: string, status: string[], lastLiveIdRange?: number[]) {
        return this.betsRepository.getLiveTableData(databaseName, status, lastLiveIdRange);
    }
    async getFixturesCount(databaseName: string) {
        return this.betsRepository.getHistoryFixturesCount(databaseName);
    }
    async getDataFromWorker(data: SelectJsonType[], options: UserOptions, user: UserEntity, type: Type, filters?: FiltersType) {
        const worker = new Worker(path.join(process.cwd(), 'dist', 'workers', 'index.js'), {
            workerData: { data, options, filters, user, leaguesStats: leaguesStatsHolder, type },
        });
        worker.on('error', (err) => console.log(err));
        worker.on('exit', (err) => console.log(err));
        // worker.postMessage({ data, options, filters });
        return new Promise<{
            filteredData: (TotalCornerFixtures & TotalCornerLives & FirstTableFields)[][];
            indicators: IndicatorsStats;
            leagues: Map<number, LeagueStatsEntity>;
            availableFilters: FiltersType;
        }>((resolve, reject) => {
            worker.on(
                'message',
                ({
                    filteredData,
                    indicators,
                    leagues,
                    availableFilters,
                    leagueStat,
                }: {
                    filteredData: (TotalCornerFixtures & TotalCornerLives & FirstTableFields)[][];
                    indicators: IndicatorsStats;
                    leagues: Map<number, LeagueStatsEntity>;
                    availableFilters: FiltersType;
                    leagueStat: LeaguesStatsFields;
                }) => {
                    leaguesStatsHolder = leagueStat;
                    resolve({ filteredData, indicators, leagues, availableFilters });
                }
            );
        });
    }
    async startThread(data: SelectJsonType[], options: UserOptions, user: UserEntity, type: Type, filters?: FiltersType) {
        const chunks = [...Array(Math.floor(data.length / 3) + 1)]
            .map((_, c) => data.filter((n, i) => (c + 1) * 3 > i && i >= c * 3))
            .filter((e) => e.length);
        let workerData = [];
        for await (const item of chunks) {
            const resultOfCalculating = await this.getDataFromWorker(item, options, user, type, filters);
            workerData.push(resultOfCalculating);
        }
        console.log(workerData);
        return workerData[0];
    }
    async saveHistoryFixtures(databaseName: string, fixtures: SelectJsonType[]) {
        const exist = await this.existFixturesByDatabase(databaseName);
        if (exist) {
            return this.betsRepository.updateByDatabaseName(databaseName, fixtures);
        }
        return this.betsRepository.saveFixtures(databaseName, fixtures);
    }
    async existFixturesByDatabase(databaseName: string) {
        return 1;
        // return this.betsRepository.findByDatabase(databaseName);
    }
    async lastLiveId() {
        return this.betsRepository.lastLiveRow();
    }
}
