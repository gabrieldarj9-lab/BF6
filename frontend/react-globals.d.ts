declare const React: any;
declare const ReactDOM: any;

declare namespace JSX {
  interface IntrinsicAttributes {
    key?: any;
  }

  interface ElementChildrenAttribute {
    children: {};
  }

  interface IntrinsicElements {
    [elementName: string]: any;
  }
}
