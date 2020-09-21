declare module '*.scss' {
    const content: string;
    export default content;
}


// Utility types
type ExtractPropertyNamesOfType<T, S>
  = { [K in keyof T]: T[K] extends S ? K : never }[keyof T];

type ExcludePropertyNamesOfType<T, S>
  = { [K in keyof T]: T[K] extends S ? never : K }[keyof T];

type ExtractPropertiesOfType<T, S>
  = Pick<T, ExtractPropertyNamesOfType<T, S>>;

type ExcludePropertiesOfType<T, S>
  = Pick<T, ExcludePropertyNamesOfType<T, S>>;

type GenericFunction = (...args: any) => any;
type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;
