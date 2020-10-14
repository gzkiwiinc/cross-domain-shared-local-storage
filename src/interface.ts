export interface IStorageHubPermission
{
    /**
     * The value of origin is expected to be a RegExp, and allow, an array of strings.
     * The cross storage hub is then initialized to accept requests from any of
     * the matching origins
     */
    origin: RegExp,
    /**
     * Allowing access to the associated lists of methods
     * observed: monitor localStorage key value changes
     */
    allow: IClientMethodEnum[],
}

export interface IStorageClientOption
{
    /**
     * Request timeout millisecond
     */
    timeout?: number,
}

export enum IClientMethodEnum
{
    GET = 'get',
    SET = 'set',
    DEL =  'del',
    CLEAR = 'clear',
    OBSERVED = 'observed',
    UNOBSERVED = 'unobserved'
}

export enum IHubMethodEnum
{
    READY = 'ready',
    UNAVAILABLE = 'unavailable',
    ERROR = 'error',
    RESPONSE = 'response',
    PUSH = 'push'
}

export interface IMessageRequest<T>
{
    id?: string,
    method: IClientMethodEnum,
    param?: T,
}

export interface IMessageResponse<T>
{
    id?: string,
    method: IHubMethodEnum,
    body?: T,
}

export interface IObserver
{
    origin: string,
    keys: string[],
}

export interface ISubscribe
{
    keys: string[],
    callback: (ev: IStorageChange) => void,
}

export interface IStorageChange
{
    key: string,
    newValue: any,
    oldValue: any,
}

export interface ISetParam
{
    key: string,
    value: string,
}

export interface IGetParam
{
    key: string,
}

export interface IDelParam
{
    key: string,
}

