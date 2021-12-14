import { useEffect, useMemo, useState } from "react";
import { Subject } from "rxjs";
import * as uuid from "uuid";
import { Document } from "./documents";

export type DocType<type, params> = {
  _id: string;
  _type: type;
  _label?: string;
} & params;

export type Ref<name> = { _ref: Extract<Document, { _type: name }> };
export type RefT<T> = { _ref: T };

export function ref<Value extends InsertDocs>(value: Value) {
  return { _ref: value };
}

type Update<T> = Partial<Insert<T>> & { _update: true };

type Insert<T> = Extract<Document, { _type: T }> extends DocType<
  T,
  infer params
>
  ? {
      [key in keyof params]: params[key] extends Ref<infer T>
        ? string | RefT<Insert<T>>
        : params[key];
    } & {
      _id?: string;
      _type?: T;
      _label?: string;
    }
  : never;

export type StoredDoc<T> = Extract<Document, { _type: T }> extends DocType<
  T,
  infer params
>
  ? {
      [key in keyof params]: params[key] extends Ref<any>
        ? string
        : params[key];
    } & {
      _id?: string;
      _type?: T;
      _label?: string;
    }
  : never;

export function doc<T extends Document["_type"]>(
  name: T,
  properties: Insert<T>
) {
  return {
    _id: uuid.v4(),
    _type: name,
    ...properties,
  } as Insert<T>;
}

export function upd<T extends Document["_type"]>(
  name: T,
  id: string,
  properties: Omit<Update<T>, "_update">
) {
  return {
    _type: name,
    _id: id,
    _update: true,
    ...properties,
  } as Update<T>;
}

type InsertDocs = {
  [key in Document["_type"]]: Insert<key>;
}[Document["_type"]];

type UpdateDocs = {
  [key in Document["_type"]]: Update<key>;
}[Document["_type"]];

type StoredDocs = {
  [key in Document["_type"]]: StoredDoc<key>;
}[Document["_type"]];

const queryStack = [];

class Database {
  _docs: Map<string, StoredDocs> = new Map();
  _update = new Subject();

  write(...docs: (InsertDocs | UpdateDocs)[]) {
    const docStore = this._docs;

    function deref(value: any) {
      const result = {};

      for (const [key, child] of Object.entries(value)) {
        if (key === "_update") {
          continue;
        }

        if (Array.isArray(child)) {
          result[key] = child.map((value) => deref(value));
        } else if (child != null && (child as any)._ref) {
          result[key] = writeDoc((child as any)._ref)._id;
        } else if (
          child != null &&
          typeof child === "object" &&
          Object.getPrototypeOf(child) === Object.prototype
        ) {
          result[key] = deref(child);
        } else {
          result[key] = child;
        }
      }

      return result;
    }

    function writeDoc(doc: any) {
      const id = doc._id ?? uuid.v4();

      let existingDoc = {};
      if (id && doc._update) {
        existingDoc = docStore.get(id) ?? existingDoc;
      }

      const storedDoc = { ...existingDoc, ...deref(doc), _id: id };
      docStore.set(id, { ...existingDoc, ...deref(doc), _id: id });

      return storedDoc;
    }

    for (const doc of docs) {
      writeDoc(doc);
    }

    this._update.next(Date.now());
  }

  doc<T extends Document["_type"]>(
    type: T,
    id: string
  ): StoredDoc<T> | undefined {
    return this._docs.get(id) as any;
  }

  filter<T extends Document["_type"]>(
    type: T,
    predicate: (doc: StoredDoc<T>) => void
  ): StoredDoc<T>[] {
    return Array.from(this._docs.values())
      .filter((doc) => doc._type === type)
      .filter(predicate as any) as any;
  }

  reset(docs: InsertDocs[]) {
    const docStore = new Map();

    function deref(value: any) {
      const result = {};

      for (const [key, child] of Object.entries(value)) {
        if (Array.isArray(child)) {
          result[key] = child.map((value) => deref(value));
        } else if (child != null && (child as any)._ref) {
          result[key] = writeDoc((child as any)._ref)._id;
        } else if (
          child != null &&
          typeof child === "object" &&
          Object.getPrototypeOf(child) === Object.prototype
        ) {
          result[key] = deref(child);
        } else {
          result[key] = child;
        }
      }

      return result;
    }

    function writeDoc(doc: any) {
      const id = doc._id ?? uuid.v4();
      const storedDoc = { ...deref(doc), _id: id };
      docStore.set(id, storedDoc);

      return storedDoc;
    }

    for (const doc of docs) {
      writeDoc(doc);
    }

    this._docs = docStore;
  }
}

export const database = new Database();

export const useQuery = <R>(query: (db: Database) => R) => {
  const [update, setUpdate] = useState(Date.now());

  useEffect(() => {
    const sub = database._update.subscribe({
      next() {
        setUpdate(Date.now());
      },
    });

    return () => {
      sub.unsubscribe();
    };
  }, []);

  return useMemo(() => {
    return query(database);
  }, [update]);
};
