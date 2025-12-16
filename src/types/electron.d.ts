export { };

declare global {
    interface Window {
        electron: {
            workspace: {
                select: () => Promise<void>;
                switch: (path: string) => Promise<void>;
                remove: (path: string) => Promise<void>;
            };
        };
    }
}
