/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "lodash/cloneDeep" {
  const cloneDeep: <T>(value: T) => T;
  export default cloneDeep;
}

declare module "lodash/isEmpty" {
  const isEmpty: (value: unknown) => boolean;
  export default isEmpty;
}

declare module "@/utils/changeTracker" {
  class ChangeTracker {
    track(object: any): void;
    getChange(newData: any): Record<string, any>;
  }
  export default ChangeTracker;
}
