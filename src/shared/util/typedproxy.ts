export interface TypedProxyConstructor {
    new <T, H extends object>(target: T, handler: ProxyHandler<H>): H
}

export const TypedProxy = Proxy as TypedProxyConstructor;
