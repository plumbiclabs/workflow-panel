export interface IElectronAPI {
    workflow: {
        getAll: () => Promise<any[]>;
        save: (workflow: any) => Promise<any>;
        delete: (id: number) => Promise<void>;
    };
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}