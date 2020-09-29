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

export interface IMessageRequest
{
    id?: string,
    method: IClientMethodEnum,
    param?: any,
}

export interface IMessageResponse
{
    id?: string,
    method: IHubMethodEnum,
    param?: any,
}

export interface IObserver
{
    origin: string,
    keys: string[],
}

export interface IStorageChange
{
    key: string,
    newValue: any,
    oldValue: any,
}