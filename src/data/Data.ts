import { Db } from './db';
import moment from 'moment';
import { unwrap, IDBPDatabase } from 'idb';
import * as diff from './diff';

export default class Data {
    db: Db

    constructor(db: Db) {
        this.db = db;
    }

    async addData(data: any[]) {
        let count = await this.db.count('entries');
        let type = '';
        let last = data[data.length - 2];
        console.log(Object.keys(last));

        if (last.hasOwnProperty('transmitterId')) {
            console.log('Dexcom type detected')
            type = 'Dexcom';
            await this.addDexcom(data.filter(it => !!it.timestamp));
        } else if (last.hasOwnProperty('date')
            && last.hasOwnProperty('time')
            && last.hasOwnProperty('tags')
            && last.hasOwnProperty('bloodGlucoseMeasurement')) {
            console.log('mySugr type detected');
            type = 'mySugr'
            await this.addMySugr(data);
        } else {
            console.log('Unknown type!');
        }

        return {
            type,
            count: await this.db.count('entries') - count
        }
    }

    async getData(from: Date, to: Date) {
        let range = IDBKeyRange.bound(from, to);
        let data = await this.db.getAllFromIndex('entries', 'timestampIndex', range);

        let dexcomGlucose = [];
        let mysugrGlucose = [];
        let carbs = [];
        let insulin = [];
        let exercise = [];

        for (let it of data) {
            if (it.deviceType === "dexcom") {
                if (it.type === "glucose") {
                    dexcomGlucose.push(it);
                }
            } else if (it.deviceType === "mysugr") {
                if (it.type === "glucose") {
                    mysugrGlucose.push(it);
                }
            }

            if (it.type === "carbs") {
                carbs.push(it);
            } else if (it.type === "insulin") {
                insulin.push(it);
            } else if (it.type === "exercise") {
                exercise.push(it);
            }
        }

        let threshold = 2.2 * 3600 * 1000;

        if (to.getTime() - from.getTime() > (3 * 24 * 60 * 60 * 1000)) {
            threshold = 6 * 3600 * 1000;
        }

        let maxima = diff.maxima(dexcomGlucose, threshold);
        console.log(maxima);

        return {
            data,
            dexcomGlucose,
            mysugrGlucose,
            maxima,
            carbs,
            insulin,
            exercise
        };
    }

    getLatestDataDate(): Promise<Date | null> {
        return new Promise((resolve, reject) => {
            let raw = unwrap(this.db as IDBPDatabase);
            let tx = raw.transaction('entries', 'readonly');
            let store = tx.objectStore('entries');
            let index = store.index('timestampIndex');
            let request = index.openCursor(undefined, 'prev');
            request.onsuccess = () => {
                let cursor = request.result;
                if (!cursor) {
                    resolve(null);
                } else {
                    resolve(cursor.key as Date);
                }
            };
            request.onerror = (ev) => {
                console.log(ev);
            };
        });
    }

    async getCounts() {
        let data = {
            dexcom: await this.db.countFromIndex('entries', 'deviceTypeIndex', 'dexcom'),
            freestyle: await this.db.countFromIndex('entries', 'deviceTypeIndex', 'freestyle'),
            other: 0
        }

        data.other = (await this.db.count('entries')) - data.dexcom - data.freestyle;

        return data;
    }

    async addDexcom(data: DexcomData[]) {
        console.log(`Adding dexcom data with ${data.length} rows`);
        for (let row of data) {
            let type: string;
            let value: number = 0;
            let info: string = "";
            type = row.eventType.toLowerCase();
            switch (type) {
                case "egv":
                    type = "glucose";
                    value = parseInt(row.glucoseValue);
                    break;
                case "exercise":
                    value = moment.duration(row.duration).asMilliseconds();
                    info = row.eventSubtype;
                    break;
                case "carbs":
                    value = parseInt(row.carbValue);
                    break;
                case "insulin":
                    value = parseInt(row.insulinValue);
                    break;
            }

            try {
                let entry = {
                    id: "dexcom-" + row.timestamp + "-" + row.eventType,
                    type,
                    deviceType: 'dexcom',
                    device: row.sourceDeviceId,
                    timestamp: moment(row.timestamp).toDate(),
                    transmitterId: row.transmitterId,
                    value,
                    info
                };
                await this.db.put('entries', entry);
            } catch (err) {
                console.error(err);
                return;
            }
        }
    }

    async addMySugr(data: MySugrData[]) {
        let deviceType = 'mysugr';
        for (let row of data) {
            let timestamp = moment(row.date + " " + row.time).toDate();
            let type: string;
            if (row.bloodGlucoseMeasurement) {
                await this.db.put('entries', {
                    id: "mysugr-" + timestamp.getTime() + "-glucose",
                    deviceType,
                    device: "",
                    timestamp,
                    transmitterId: "",
                    value: parseInt(row.bloodGlucoseMeasurement),
                    type: "glucose",
                    info: ""
                });
            }
            if (row.insulinInjectionUnits) {
                await this.db.put('entries', {
                    id: "mysugr-" + timestamp.getTime() + "-insulin",
                    deviceType,
                    device: "",
                    timestamp,
                    transmitterId: "",
                    value: parseInt(row.insulin),
                    type: "insulin",
                    info: ""
                });
            }
            if (row.basalInjectionUnits) {
                await this.db.put('entries', {
                    id: "mysugr-" + timestamp.getTime() + "-basal",
                    deviceType,
                    device: "",
                    timestamp,
                    transmitterId: "",
                    value: parseInt(row.basalInjectionUnits),
                    type: "basal",
                    info: ""
                });
            }
            if (row.basalInjectionUnits) {
                await this.db.put('entries', {
                    id: "mysugr-" + timestamp.getTime() + "-carbs",
                    deviceType,
                    device: "",
                    timestamp,
                    transmitterId: "",
                    value: Math.round(parseInt(row.mealCarbohydrates) * 15),
                    type: "carbs",
                    info: ""
                });
            }
        }
    }
}

interface DexcomData {
    index: string,
    timestamp: string,
    eventType: string,
    eventSubtype: string,
    patientInfo: string,
    deviceInfo: string,
    sourceDeviceId: string,
    glucoseValue: string,
    insulinValue: string,
    carbValue: string,
    duration: string,
    glucoseRateOfChange: string,
    transmitterTime: string,
    transmitterId: string
}

interface MySugrData {
    date: string,
    time: string,
    tags: string,
    bloodGlucoseMeasurement: string,
    insulinInjectionUnits: string,
    basalInjectionUnits: string,
    insulin: string,
    temporaryBasalPercentage: string,
    temporaryBasalDuration: string,
    mealCarbohydrates: string,
    mealDescriptions: string,
    activityDuration: string,
    activityIntensity: string,
    activityDescription: string,
    steps: string,
    note: string,
    location: string,
    bloodPressure: string,
    bodyWeight: string,
    hbA1c: string,
    ketones: string,
    foodType: string,
    medication: string
}
