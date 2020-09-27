export interface TypedProxyConstructor {
    new <T, H extends Record<string, unknown>>(target: T, handler: ProxyHandler<H>): H
}

export const TypedProxy = Proxy as TypedProxyConstructor;
