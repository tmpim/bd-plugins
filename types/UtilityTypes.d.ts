type ExtractPropertyNamesOfType<T, S>
  = { [K in keyof T]: T[K] extends S ? K : never }[keyof T];

type ExcludePropertyNamesOfType<T, S>
  = { [K in keyof T]: T[K] extends S ? never : K }[keyof T];

type ExtractPropertiesOfType<T, S>
  = Pick<T, ExtractPropertyNamesOfType<T, S>>;

type ExcludePropertiesOfType<T, S>
  = Pick<T, ExcludePropertyNamesOfType<T, S>>;

type GenericFunction = (...args: any[]) => unknown;
type ArgumentTypes<F extends GenericFunction> = F extends (...args: infer A) => unknown ? A : never;

type Constructor<T = unknown> = new (...args: any[]) => T;

interface FC<P = Record<string, unknown>, Children = React.ReactNode | null> {
  (props: P & { children?: Children }, context?: unknown): JSX.Element;
  propTypes?: React.WeakValidationMap<P>;
  contextTypes?: React.ValidationMap<unknown>;
  defaultProps?: Partial<P>;
  displayName?: string;
}

type JSX = React.ReactNode;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnsafeAny = any;
