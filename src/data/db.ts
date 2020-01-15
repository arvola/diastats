import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type Db = IDBPDatabase<Schema>

interface Schema extends DBSchema {
    entries: {
        key: string;
        value: {
            id: string;
            type: string;
            deviceType: string;
            device: string;
            timestamp: Date;
            transmitterId: string;
            value: number;
            info: string;
        },
        indexes: {
            timestampIndex: Date;
            deviceTypeIndex: string;
        }
    }
}

let db: IDBPDatabase<Schema> | null;

export default async function openDb() {
    if (!db) {
        db = await openDB<Schema>('data-db', 1, {
            upgrade(db) {
                const dataStore = db.createObjectStore('entries', {
                    keyPath: 'id'
                });
                dataStore.createIndex('timestampIndex', 'timestamp');
                dataStore.createIndex('deviceTypeIndex', 'deviceType');
            }
        })
    }

    return db;
}
