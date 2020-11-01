import { IHubMethodEnum, IStorageHubPermission, IMessageRequest, IClientMethodEnum, IMessageResponse, IObserver, IStorageChange, ISetParam, IDelParam, IGetParam } from '../interface';

export default class StorageHub
{
    private static _instance: StorageHub;

    private _permissions: IStorageHubPermission[];

    private _observers: IObserver[] = [];

    static getInstance()
    {
        if(!this._instance)
        {
            this._instance = new StorageHub()
        }
        return this._instance
    }

    constructor()
    {
        console.log('StorageHub constructor')
    }

    init(permissions: IStorageHubPermission[])
    {
        // localStorage is unavailable
        if(!window.localStorage)
        {
            this.sendMsgToClient('*', { method: IHubMethodEnum.UNAVAILABLE })
            return
        }

        this._permissions = permissions;
        this.installListener();
        this.sendMsgToClient('*', { method: IHubMethodEnum.READY });
    }

    private installListener()
    {
        if (window.addEventListener)
        {
            window.addEventListener('message', this._messageListener);
            window.addEventListener('storage', this._storageListener);
        }
        else if((window as any).attachEvent)
        {
            (window as any).attachEvent('onmessage', this._messageListener);
            (window as any).attachEvent('onstorage', this._messageListener);
        }
        else
        {
            console.error('This browser was not support!')
        }
    }

    private _messageListener = (ev: MessageEvent<string>) =>
    {
        console.log('hub income message => ', ev)
        let request: IMessageRequest<any>
        try
        {
            request = JSON.parse(ev.data);
        }
        catch(err)
        {
            this.sendMsgToClient(ev.origin, { method: IHubMethodEnum.ERROR, body: `'Json parse error: ${err}` });
            console.error('Json parse error', err);
            return
        }

        // Ignore the ready message when viewing the hub directly
        if(request.method === IHubMethodEnum.READY)
        {
            return
        }

        // check allow origin
        if(Array.isArray(this._permissions) && this._permissions.some(permission => permission.origin.test(ev.origin)))
        {
            const permission = this._permissions.find(permission => permission.origin.test(ev.origin));

            // check allow method
            if(permission && permission.allow.some(allowMethod => allowMethod === request.method))
            {
                try
                {
                    if(request.method === IClientMethodEnum.OBSERVED)
                    {
                        this._observed(ev.origin, request)
                    }
                    else if(request.method === IClientMethodEnum.UNOBSERVED)
                    {
                        this._unobserved(ev.origin)
                    }
                    else
                    {
                        // Prevent malicious users from calling other private methods
                        const result = this['_safe_' + request.method](request.param)
                        const response = this.requestTransferResponse(request, IHubMethodEnum.RESPONSE, result)
                        this.sendMsgToClient(ev.origin, response)
                    }
                }
                catch(err)
                {
                    const response = this.requestTransferResponse(request, IHubMethodEnum.ERROR, `Method ${request.method } error: ${err}`)
                    this.sendMsgToClient(ev.origin, response);
                }
            }
            else
            {
                const response = this.requestTransferResponse(request, IHubMethodEnum.ERROR, `Method not allowed: ${request.method }`)
                this.sendMsgToClient(ev.origin, response);
            }
        }
        else
        {
            const response = this.requestTransferResponse(request, IHubMethodEnum.ERROR, `Domain not allowed: ${ev.origin}`)
            this.sendMsgToClient(ev.origin, response);
        }
    }

    private _storageListener = (ev: StorageEvent) =>
    {
        console.log('_storageListener => ', ev)
        const { key, oldValue, newValue } = ev
        if(key)
        {
            const tragetObservers = this._observers.filter(observer => observer.keys.includes(key))
            tragetObservers.map(observer =>
            {
                const response: IMessageResponse<IStorageChange> = {
                    method: IHubMethodEnum.PUSH,
                    body: {
                        key,
                        oldValue,
                        newValue 
                    }
                }
                this.sendMsgToClient(observer.origin, response)
            })
        }
    }

    private _safe_get(param: IGetParam)
    {
        try
        {
            const value = window.localStorage.getItem(param.key);
            return value
        }
        catch(err)
        {
            console.error('Get value error:', err)
            throw err
        }
    }

    private _safe_set(param: ISetParam)
    {
        try
        {
            window.localStorage.setItem(param.key, param.value);
            return true
        }
        catch(err)
        {
            console.error(`Set ${ param.key } value error: ${err}`)
            throw err
        }
    }

    private _safe_del(param: IDelParam)
    {
        try
        {
            window.localStorage.removeItem(param.key)
            return true
        }
        catch(err)
        {
            console.error(`Delete ${ param.key } value error: ${err}`)
            throw err
        }
    }

    private _safe_clear()
    {
        try
        {
            window.localStorage.clear()
            return true
        }
        catch(err)
        {
            console.error('Clear error:', err)
            throw err
        }
    }

    private _observed(origin: string, request: IMessageRequest<string[]>)
    {
        console.log('_observed', origin, request, this._observers)
        if(!Array.isArray(this._observers))
        {
            this._observers = []
        }
        if(this._observers.some(observer => observer.origin === origin))
        {
            this._observers = this._observers.map(observer =>
            {
                if(observer.origin === origin)
                {
                    const newKeys: string[] = request.param || [];
                    const keySet = new Set([ ...observer.keys, ...newKeys ])
                    return Object.assign({}, observer, { keys: keySet });
                }
                return observer
            })
        }
        else
        {
            this._observers = [ { origin, keys: request.param || [] } ]
        }
        console.log('_observed set success => ', this._observers)
    }

    private _unobserved(origin: string)
    {
        if(!Array.isArray(this._observers))
        {
            this._observers = []
        }
        this._observers = this._observers.filter(observer => observer.origin !== origin)
    }

    private sendMsgToClient<T>(origin: string, response: IMessageResponse<T>)
    {
        if(window && window.parent && window.parent.postMessage)
        {
            console.log('sendMsgToClient => ', response, origin)
            // 当 origin 为 'null' 时，表示当前hub被 file:// 协议所加载
            const targetOrigin = origin && origin !== 'null' ? origin : '*'
            window.parent.postMessage(JSON.stringify(response), targetOrigin)
        }
        else
        {
            console.error('Error parent')
        }
    }

    private requestTransferResponse<T, K>(request: IMessageRequest<T>, method: IHubMethodEnum, param: K)
    {
        const response: IMessageResponse<K> = Object.assign({}, request, { method, body: param })
        return response
    }
}