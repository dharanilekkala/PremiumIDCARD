/**
 * lib/server/db.ts
 * MongoDB Atlas via the native Node.js driver — exposes a Prisma-compatible
 * API so all API routes work without modification.
 *
 * Why native driver instead of Prisma 5?  Prisma's Rust engine uses its own
 * TLS stack (webpki-roots) that does not use the Windows certificate store.
 * On machines with SSL inspection (antivirus/proxy) this causes
 * "invalid peer certificate: UnknownIssuer". The native mongodb driver runs
 * in Node.js and trusts the system/Windows certificate store.
 */
import { MongoClient, Document, Filter } from "mongodb";

// ── Connection singleton ─────────────────────────────────────────────────────

const URI = process.env.DATABASE_URL;
if (!URI) throw new Error("DATABASE_URL env var is not set");

const globalMongo = globalThis as unknown as { _mongoClient?: MongoClient };
const client: MongoClient = globalMongo._mongoClient ?? new MongoClient(URI);
if (process.env.NODE_ENV !== "production") globalMongo._mongoClient = client;

function dbName(): string {
  // Extract DB name from connection string, fall back to "idforge"
  try {
    const url = new URL(URI!);
    const name = url.pathname.replace(/^\//, "");
    return name || "idforge";
  } catch {
    return "idforge";
  }
}

async function col(name: string) {
  await client.connect(); // no-op if already connected
  return client.db(dbName()).collection(name);
}

// ── ID helpers ───────────────────────────────────────────────────────────────

function newId(): string {
  // 24-char hex string — same length as MongoDB ObjectId strings
  return Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Document conversion ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDoc(doc: Document | null): any {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDocs(docs: Document[]): any[] {
  return docs.map(d => fromDoc(d)!);
}

// ── Filter builder ───────────────────────────────────────────────────────────

function toFilter(where?: Record<string, unknown>): Filter<Document> {
  if (!where) return {};
  const f: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(where)) {
    f[k === "id" ? "_id" : k] = v;
  }
  return f as Filter<Document>;
}

// ── Sort builder ─────────────────────────────────────────────────────────────

function toSort(orderBy?: unknown): Record<string, 1 | -1> {
  if (!orderBy) return {};
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
  const sort: Record<string, 1 | -1> = {};
  for (const entry of entries as Record<string, string>[]) {
    for (const [k, dir] of Object.entries(entry)) {
      sort[k] = dir === "asc" ? 1 : -1;
    }
  }
  return sort;
}

// ── Include / join resolver ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveInclude(doc: any, include: Record<string, unknown>) {
  for (const [rel, opts] of Object.entries(include)) {
    if (!opts) continue;

    if (rel === "organization" && doc.organizationId) {
      const c = await col("organizations");
      const org = await c.findOne({ _id: doc.organizationId });
      if (org) {
        const orgDoc = fromDoc(org);
        if (typeof opts === "object" && opts !== null && "select" in opts) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const selected: Record<string, unknown> = {};
          for (const sk of Object.keys((opts as { select: Record<string, boolean> }).select)) {
            selected[sk] = orgDoc[sk];
          }
          doc[rel] = selected;
        } else {
          doc[rel] = orgDoc;
        }
      }
    }

    if (rel === "users" && doc.id) {
      const c = await col("users");
      const users = await c.find({ organizationId: doc.id }).toArray();
      doc[rel] = fromDocs(users);
    }
  }
}

// ── Generic model factory ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeModel(colName: string): any {
  return {
    async findUnique({ where, include }: { where: Record<string, unknown>; include?: Record<string, unknown> }) {
      const c = await col(colName);
      const doc = await c.findOne(toFilter(where));
      if (!doc) return null;
      const r = fromDoc(doc);
      if (include) await resolveInclude(r, include);
      return r;
    },

    async findMany({ where, include, orderBy, skip, take }: {
      where?: Record<string, unknown>;
      include?: Record<string, unknown>;
      orderBy?: unknown;
      skip?: number;
      take?: number;
    } = {}) {
      const c = await col(colName);
      const sort = toSort(orderBy);
      let cursor = c.find(toFilter(where));
      if (Object.keys(sort).length) cursor = cursor.sort(sort);
      if (skip) cursor = cursor.skip(skip);
      if (take) cursor = cursor.limit(take);
      const docs = await cursor.toArray();
      const results = fromDocs(docs);
      if (include) {
        for (const r of results) await resolveInclude(r, include);
      }
      return results;
    },

    async create({ data, include }: { data: Record<string, unknown>; include?: Record<string, unknown> }) {
      const c = await col(colName);
      const _id = newId();
      const doc = { _id, createdAt: new Date(), ...data };
      await c.insertOne(doc as Document);
      const r = fromDoc(doc as Document);
      if (include) await resolveInclude(r, include);
      return r;
    },

    async update({ where, data, include }: { where: Record<string, unknown>; data: Record<string, unknown>; include?: Record<string, unknown> }) {
      const c = await col(colName);
      const result = await c.findOneAndUpdate(
        toFilter(where),
        { $set: data },
        { returnDocument: "after" }
      );
      if (!result) return null;
      const r = fromDoc(result);
      if (include) await resolveInclude(r, include);
      return r;
    },

    async upsert({ where, update, create }: {
      where: Record<string, unknown>;
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }) {
      const c = await col(colName);
      const existing = await c.findOne(toFilter(where));
      if (existing) {
        const result = await c.findOneAndUpdate(
          toFilter(where),
          { $set: update },
          { returnDocument: "after" }
        );
        return fromDoc(result);
      }
      const _id = newId();
      const doc = { _id, createdAt: new Date(), ...create };
      await c.insertOne(doc as Document);
      return fromDoc(doc as Document);
    },

    async delete({ where }: { where: Record<string, unknown> }) {
      const c = await col(colName);
      const doc = await c.findOneAndDelete(toFilter(where));
      return doc ? fromDoc(doc) : null;
    },

    async count(args?: { where?: Record<string, unknown> }) {
      const c = await col(colName);
      return c.countDocuments(toFilter(args?.where));
    },

    async createMany({ data }: { data: Record<string, unknown>[] }) {
      const c = await col(colName);
      const now = new Date();
      const docs = data.map(d => ({ _id: newId(), createdAt: now, ...d }));
      const result = await c.insertMany(docs as Document[]);
      return { count: result.insertedCount };
    },
  };
}

// ── Transaction helper ───────────────────────────────────────────────────────

async function $transaction<T>(fn: (tx: typeof prisma) => Promise<T>): Promise<T> {
  await client.connect();
  const session = client.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(prisma);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

// ── Public export (Prisma-compatible API) ────────────────────────────────────

export const prisma = {
  organization: makeModel("organizations"),
  user:         makeModel("users"),
  auditLog:     makeModel("auditLogs"),
  $transaction,
  $disconnect:  async () => client.close(),
};
