import { useEffect, useMemo, useState, Dispatch } from "react";

export const encoderBoolean = (v: boolean): string => {
  return v === true ? "Y" : "";
};

export const decoderBoolean = (v: string): boolean => {
  return v === "Y";
};

export const encoderFloat = (v: number): string => {
  return v === null || v === undefined ? "" : v.toString();
};

export const decoderFloat = (v: string): number | null => {
  return v === "" ? null : parseFloat(v);
};

export const encoderInt = encoderFloat;

export const decoderInt = (v: string): number | null => {
  return v === "" ? null : parseInt(v);
};

export interface ComponentData<T> {
  name: string;
  value: T;
  encoder?: (value: T) => any;
  decoder?: (value: any) => T;
  setter: Dispatch<T>;
  pack_json?: boolean;
}

export const useQueryParams = (
  components: Array<ComponentData<any>>,
  dependencies?: any
) => {
  const loaded = useLoadParams(components);
  useStoreParams(loaded, components, dependencies);
  return loaded;
};

const useLoadParams = (components: Array<ComponentData<any>>) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const p = new URLSearchParams(document.location.search);
    for (const component of components) {
      let data = p.get(component.name);
      if (data !== undefined && data !== null) {
        if (component.pack_json) {
          try {
            data = JSON.parse(data);
          } catch (e) {
            console.warn(`unable to decode qs param ${component.name}: ${e}`);
          }
        }
        component.setter(component.decoder ? component.decoder(data) : data);
      }
    }
    setLoaded(true);
  }, []);
  return loaded;
};

const useStoreParams = (
  loaded: boolean,
  components: Array<ComponentData<any>>,
  dependencies?: any
) => {
  const deps = useMemo(() => {
    return [dependencies, loaded];
  }, dependencies);
  useEffect(() => {
    if (loaded) {
      const p = new URLSearchParams(document.location.search);
      for (const component of components) {
        let data = component.encoder
          ? component.encoder(component.value)
          : component.value;
        if (component.pack_json) {
          data = JSON.stringify(data);
        }
        p.set(component.name, data);
      }
      const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${p}`;
      window.history.pushState({ path: url }, "", url);
    }
  }, deps);
};
