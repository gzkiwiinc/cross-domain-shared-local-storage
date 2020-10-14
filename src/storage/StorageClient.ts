import { IHubMethodEnum, IClientMethodEnum, IMessageRequest, IMessageResponse, IStorageClientOption, IStorageChange, IGetParam, ISetParam, IDelParam, ISubscribe } from "../interface";

export default class StorageClient
{
    private static _instance: StorageClient;

    private _url: string;

    private _connected: boolean;

    private _frameId: string;

    private _timeout: number;

    private _hub: Window | null;

    private _subscribe: ISubscribe | null;

    constructor()
    {
        console.log('StorageClient');
        this._connected = false;
    }

    public static getInstance()
    {
        if(!this._instance)
        {
            this._instance = new StorageClient();
        }
        return this._instance
    }

    public connect(url: string, opts: IStorageClientOption = {})
    {
        const needCreate = !this._connected || this._url !== url
        this._url = url
        this._frameId = `cross-domain-storage-${Date.now().toString()}`
        this._timeout = opts.timeout || 5000;
        return new Promise<StorageClient>((resolve, reject) =>
        {
            if(needCreate)
            {
                this.installGlobalListener();
                let timer: NodeJS.Timeout;
                // 监听 ready 或 unavailable 事件
                const iframeReadyListener = (ev: MessageEvent<string>) =>
                {
                    let response: IMessageResponse<any>
                    try
                    {
                        response = JSON.parse(ev.data);
                    }
                    catch(err)
                    {
                        console.error('Json parse error', err);
                        return
                    }
                    if(response.method === IHubMethodEnum.READY)
                    {
                        this._connected = true;
                        // 清除超时定时器
                        timer && clearTimeout(timer);
                        resolve(this)
                    }
                    else if(response.method === IHubMethodEnum.UNAVAILABLE)
                    {
                        this._connected = false;
                        // 清除超时定时器
                        timer && clearTimeout(timer);
                        reject(new Error('Browser does not support localStorage'))
                    }
                }
                this._addMessageListener(iframeReadyListener);
                // 创建iframe
                this._hub = this.createIframe();

                if(!this._hub)
                {
                    this._connected = false;
                    reject(new Error('Iframe creation failed'))
                }
                else
                {
                    timer = setTimeout(() =>
                    {
                        this._removeMessageListener(iframeReadyListener);
                        this._connected = false;
                        reject(new Error('Connection timed out'))
                    }, this._timeout)
                }
            }
            else
            {
                this._connected = true;
                resolve(this)
            }
        })
    }

    public getIframeId()
    {
        if(this._connected)
        {
            return this._frameId
        }
        else
        {
            return null
        }
    }

    public setItem(key: string, value: string)
    {
        return new Promise<boolean>((resolve, reject) =>
        {
            if(this._connected && this._hub)
            {
                let timer: NodeJS.Timeout;
                const requestId = `${IClientMethodEnum.SET}-${Date.now()}-${Math.ceil(Math.random() * 1000)}`;
                // 监听 ready 或 unavailable 事件
                const setItemListener = (ev: MessageEvent<string>) =>
                {
                    let response: IMessageResponse<boolean>
                    try
                    {
                        response = JSON.parse(ev.data);
                    }
                    catch(err)
                    {
                        console.error('Json parse error', err);
                        return
                    }
                    if(response.method === IHubMethodEnum.RESPONSE && response.id === requestId)
                    {
                        // 清除超时定时器
                        timer && clearTimeout(timer);
                        resolve(response.body)
                    }
                    else if(response.method === IHubMethodEnum.ERROR)
                    {
                        this._connected = false;
                        // 清除超时定时器
                        timer && clearTimeout(timer);
                        reject(new Error('Browser does not support localStorage'))
                    }
                }
                this._addMessageListener(setItemListener);
                const request: IMessageRequest<ISetParam> = {
                    id: requestId,
                    method: IClientMethodEnum.SET,
                    param: { key, value },
                }
                this.sendMsgToHub(request)
                timer = setTimeout(() =>
                {
                    this._removeMessageListener(setItemListener);
                    reject(new Error('Connection timed out'))
                }, this._timeout)
            }
            else
            {
                reject(new Error('Must be connected first'))
            }
        })
    }

    public getItem(key: string)
    {
        return new Promise<string>((resolve, reject) =>
        {
            if(this._connected && this._hub)
            {
                let timer: NodeJS.Timeout;
                const requestId = `${IClientMethodEnum.GET}-${Date.now()}-${Math.ceil(Math.random() * 1000)}`;
                // 监听 ready 或 unavailable 事件
                const getItemListener = (ev: MessageEvent<string>) =>
                {
                    let response: IMessageResponse<string>
                    try
                    {
                        response = JSON.parse(ev.data);
                    }
                    catch(err)
                    {
                        console.error('Json parse error', err);
                        return
                    }
                    if(response.method === IHubMethodEnum.RESPONSE && response.id === requestId)
                    {
                        // 清除超时定时器
                        timer && clearTimeout(timer);
                        resolve(response.body)
                    }
                    else if(response.method === IHubMethodEnum.ERROR)
                    {
                        // 清除超时定时器
                        timer && clearTimeout(timer);
                        reject(new Error('Browser does not support localStorage'))
                    }
                }
                this._addMessageListener(getItemListener);
                const request: IMessageRequest<IGetParam> = {
                    id: requestId,
                    method: IClientMethodEnum.GET,
                    param: { key },
                }
                this.sendMsgToHub(request)
                timer = setTimeout(() =>
                {
                    this._removeMessageListener(getItemListener);
                    reject(new Error('Connection timed out'))
                }, this._timeout)
            }
            else
            {
                reject(new Error('Must be connected first'))
            }
        })
    }

    public removeItem(key: string)
    {
        return new Promise<boolean>((resolve, reject) =>
        {
            if(this._connected && this._hub)
            {
                let timer: NodeJS.Timeout;
                const requestId = `${IClientMethodEnum.DEL}-${Date.now()}-${Math.ceil(Math.random() * 1000)}`;
                // 监听 ready 或 unavailable 事件
                const delItemListener = (ev: MessageEvent<string>) =>
                {
                    let response: IMessageResponse<boolean>
                    try
                    {
                        response = JSON.parse(ev.data);
                    }
                    catch(err)
                    {
                        console.error('Json parse error', err);
                        return
                    }
                    if(response.method === IHubMethodEnum.RESPONSE && response.id === requestId)
                    {
                        // 清除超时定时器
                        timer && clearTimeout(timer);
                        resolve(response.body)
                    }
                    else if(response.method === IHubMethodEnum.ERROR)
                    {
                        // 清除超时定时器
                        timer && clearTimeout(timer);
                        reject(new Error('Browser does not support localStorage'))
                    }
                }
                this._addMessageListener(delItemListener);
                const request: IMessageRequest<IDelParam> = {
                    id: requestId,
                    method: IClientMethodEnum.DEL,
                    param: { key },
                }
                this.sendMsgToHub(request)
                timer = setTimeout(() =>
                {
                    this._removeMessageListener(delItemListener);
                    reject(new Error('Connection timed out'))
                }, this._timeout)
            }
            else
            {
                reject(new Error('Must be connected first'))
            }
        })
    }

    public clear()
    {
        return new Promise<boolean>((resolve, reject) =>
        {
            if(this._connected && this._hub)
            {
                let timer: NodeJS.Timeout;
                const requestId = `${IClientMethodEnum.CLEAR}-${Date.now()}-${Math.ceil(Math.random() * 1000)}`;
                // 监听 ready 或 unavailable 事件
                const clearStorageListener = (ev: MessageEvent<string>) =>
                {
                    let response: IMessageResponse<boolean>
                    try
                    {
                        response = JSON.parse(ev.data);
                    }
                    catch(err)
                    {
                        console.error('Json parse error', err);
                        return
                    }
                    if(response.method === IHubMethodEnum.RESPONSE && response.id === requestId)
                    {
                        // 清除超时定时器
                        timer && clearTimeout(timer);
                        resolve(response.body)
                    }
                    else if(response.method === IHubMethodEnum.ERROR)
                    {
                        // 清除超时定时器
                        timer && clearTimeout(timer);
                        reject(new Error('Browser does not support localStorage'))
                    }
                }
                this._addMessageListener(clearStorageListener);
                const request: IMessageRequest<undefined> = {
                    id: requestId,
                    method: IClientMethodEnum.CLEAR,
                }
                this.sendMsgToHub(request)
                timer = setTimeout(() =>
                {
                    this._removeMessageListener(clearStorageListener);
                    reject(new Error('Connection timed out'))
                }, this._timeout)
            }
            else
            {
                reject(new Error('Must be connected first'))
            }
        })
    }

    public subscribeItems(keys: string[], callback: (ev: IStorageChange) => void)
    {
        if(this._connected && this._hub)
        {
            this._subscribe = {
                keys,
                callback,
            }
            const request: IMessageRequest<string[]> = {
                method: IClientMethodEnum.OBSERVED,
                param: keys,
            }
            this.sendMsgToHub(request);
        }
    }

    public unsubscribeItems()
    {
        if(this._connected && this._hub)
        {
            this._subscribe = null
            const request: IMessageRequest<undefined> = {
                method: IClientMethodEnum.UNOBSERVED,
            }
            this.sendMsgToHub(request);
        }
    }

    private sendMsgToHub<T>(request: IMessageRequest<T>)
    {
        if(this._hub)
        {
            this._hub.postMessage(JSON.stringify(request), origin)
        }
    }

    private createIframe()
    {
        const iframe = window.document.createElement('iframe');
        iframe.id = this._frameId;
        iframe.style['display'] = 'none';
        iframe.style['position'] = 'absolute';
        window.document.body.appendChild(iframe);
        iframe.src = this._url;
        return iframe ? iframe.contentWindow : null
    }

    private installGlobalListener()
    {
        this._addMessageListener(this.subscribeHubListener)
    }

    private subscribeHubListener = (ev: MessageEvent<string>) =>
    {
        let response: IMessageResponse<IStorageChange>
        try
        {
            response = JSON.parse(ev.data);
        }
        catch(err)
        {
            console.error('Json parse error', err);
            return
        }
        if(response.method === IHubMethodEnum.PUSH && this._subscribe)
        {
            response.body && this._subscribe.callback(response.body)
        }
    }

    private _addMessageListener(listener: (ev: MessageEvent<string>) => void)
    {
        if (window.addEventListener)
        {
            window.addEventListener('message', listener);
        }
        else if((window as any).attachEvent)
        {
            (window as any).attachEvent('onmessage', listener);
        }
        else
        {
            console.error('This browser was not support!')
        }
    }

    private _removeMessageListener(listener: (ev: MessageEvent<string>) => void)
    {
        if (window.removeEventListener)
        {
            window.removeEventListener('message', listener);
        }
        else if((window as any).detachEvent)
        {
            (window as any).detachEvent('onmessage', listener);
        }
        else
        {
            console.error('This browser was not support!')
        }
    }
}