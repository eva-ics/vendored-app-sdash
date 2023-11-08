import { useEffect, useState, Dispatch } from "react";

export enum ComponentParameterPack {
  Json = "json",
  URI = "URI"
}

export interface ComponentData<T> {
  name: string;
  value: T;
  encoder?: (value: T) => string;
  decoder?: (value: T) => string;
  setter: Dispatch<T>;
  pack?: ComponentParameterPack;
}

export const useQueryParams = (
  base_uri: string,
  components: Array<ComponentData<any>>,
  dependencies?: any
) => {
  const loaded = useLoadParams(components);
  useStoreParams(loaded, base_uri, components, dependencies);
  return loaded;
};

const useLoadParams = (components: Array<ComponentData<any>>) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const p = new URLSearchParams(document.location.search);
    for (const component of components) {
      let data = p.get(component.name);
      if (data !== undefined && data !== null) {
        if (component.pack === ComponentParameterPack.Json) {
          try {
            data = JSON.parse(data);
          } catch {}
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
  base_uri: string,
  components: Array<ComponentData<any>>,
  dependencies?: any
) => {
  useEffect(() => {
    if (loaded) {
      let qs = base_uri;
      for (const component of components) {
        let data = component.encoder
          ? component.encoder(component.value)
          : component.value;
        switch (component.pack) {
          case ComponentParameterPack.Json:
            data = encodeURIComponent(JSON.stringify(data));
            break;
          case ComponentParameterPack.URI:
            data = encodeURIComponent(data);
            break;
        }
        qs += `&${component.name}=${data}`;
      }
      const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}${qs}`;
      window.history.pushState({ path: url }, "", url);
    }
  }, [dependencies, loaded]);
};
