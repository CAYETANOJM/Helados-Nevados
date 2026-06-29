require('dotenv').config();

const dns = require('node:dns');
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN || 'dev-token-helados';
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'helados_nevados';

let db;

const DEFAULT_IMAGES = {
  chocolate: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80',
  fresa: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=900&q=80',
  oreo: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=900&q=80',
  vainilla: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=900&q=80',
  menta: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?auto=format&fit=crop&w=900&q=80',
  frutosRojos: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=900&q=80',
  tamano: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?auto=format&fit=crop&w=900&q=80',
  cono: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=900&q=80',
  vaso: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80',
  topping: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80',
  malteada: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80',
  postre: 'https://images.unsplash.com/photo-1514849302-984523450cf4?auto=format&fit=crop&w=900&q=80',
  delivery: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80'
};

const catalogDefaults = {
  tamanos: {
    chico: {
      descripcion: '$25 | Porcion individual',
      imagen: DEFAULT_IMAGES.tamano
    },
    mediano: {
      descripcion: '$35 | El favorito de la casa',
      imagen: DEFAULT_IMAGES.tamano
    },
    grande: {
      descripcion: '$45 | Doble antojo',
      imagen: DEFAULT_IMAGES.tamano
    },
    familiar: {
      descripcion: '$95 | Para compartir',
      imagen: DEFAULT_IMAGES.tamano
    }
  },
  tipos: {
    cono: {
      descripcion: 'Presentacion clasica y crujiente.',
      imagen: DEFAULT_IMAGES.cono
    },
    vaso: {
      descripcion: 'Practico para llevar y disfrutar sin prisa.',
      imagen: DEFAULT_IMAGES.vaso
    },
    barquillo: {
      descripcion: 'Toque artesanal con textura dorada.',
      imagen: DEFAULT_IMAGES.cono
    },
    canasta: {
      descripcion: 'Formato especial para postre premium.',
      imagen: DEFAULT_IMAGES.vaso
    }
  },
  toppings: {
    chispas: {
      descripcion: 'Extra $5 | Toque divertido de color.',
      imagen: DEFAULT_IMAGES.topping
    },
    gomitas: {
      descripcion: 'Extra $7 | Dulce y suave.',
      imagen: DEFAULT_IMAGES.topping
    },
    'oreo triturada': {
      descripcion: 'Extra $8 | Galleta crujiente sobre crema.',
      imagen: DEFAULT_IMAGES.oreo
    },
    cajeta: {
      descripcion: 'Extra $6 | Dulzor tradicional.',
      imagen: DEFAULT_IMAGES.topping
    },
    nuez: {
      descripcion: 'Extra $10 | Aroma tostado y textura premium.',
      imagen: DEFAULT_IMAGES.topping
    },
    'chocolate liquido': {
      descripcion: 'Extra $6 | Salsa intensa y brillante.',
      imagen: DEFAULT_IMAGES.chocolate
    }
  },
  servicios: {
    paletas: {
      imagen: DEFAULT_IMAGES.fresa
    },
    malteadas: {
      imagen: DEFAULT_IMAGES.malteada
    },
    'postres frios': {
      imagen: DEFAULT_IMAGES.postre
    },
    'entrega a domicilio': {
      imagen: DEFAULT_IMAGES.delivery
    },
    'helado vegano': {
      imagen: DEFAULT_IMAGES.vainilla
    }
  }
};

const seed = {
  sabores: [
    {
      nombre: 'chocolate',
      descripcion: 'Clasico cremoso con cacao',
      precioExtra: 0,
      imagen: DEFAULT_IMAGES.chocolate,
      popularidad: 98,
      disponible: true
    },
    {
      nombre: 'fresa',
      descripcion: 'Fresco y frutal',
      precioExtra: 0,
      imagen: DEFAULT_IMAGES.fresa,
      popularidad: 91,
      disponible: true
    },
    {
      nombre: 'oreo',
      descripcion: 'Cremoso con galleta',
      precioExtra: 5,
      imagen: DEFAULT_IMAGES.oreo,
      popularidad: 95,
      disponible: true
    },
    {
      nombre: 'vainilla',
      descripcion: 'Suave y tradicional',
      precioExtra: 0,
      imagen: DEFAULT_IMAGES.vainilla,
      popularidad: 87,
      disponible: true
    },
    {
      nombre: 'menta',
      descripcion: 'Refrescante con toque dulce',
      precioExtra: 4,
      imagen: DEFAULT_IMAGES.menta,
      popularidad: 82,
      disponible: true
    },
    {
      nombre: 'frutos rojos',
      descripcion: 'Mezcla de frutos del bosque',
      precioExtra: 6,
      imagen: DEFAULT_IMAGES.frutosRojos,
      popularidad: 89,
      disponible: true
    }
  ],
  tamanos: [
    {
      nombre: 'chico',
      precio: 25,
      descripcion: catalogDefaults.tamanos.chico.descripcion,
      imagen: catalogDefaults.tamanos.chico.imagen,
      disponible: true
    },
    {
      nombre: 'mediano',
      precio: 35,
      descripcion: catalogDefaults.tamanos.mediano.descripcion,
      imagen: catalogDefaults.tamanos.mediano.imagen,
      disponible: true
    },
    {
      nombre: 'grande',
      precio: 45,
      descripcion: catalogDefaults.tamanos.grande.descripcion,
      imagen: catalogDefaults.tamanos.grande.imagen,
      disponible: true
    },
    {
      nombre: 'familiar',
      precio: 95,
      descripcion: catalogDefaults.tamanos.familiar.descripcion,
      imagen: catalogDefaults.tamanos.familiar.imagen,
      disponible: true
    }
  ],
  tipos: [
    {
      nombre: 'cono',
      descripcion: catalogDefaults.tipos.cono.descripcion,
      imagen: catalogDefaults.tipos.cono.imagen,
      disponible: true
    },
    {
      nombre: 'vaso',
      descripcion: catalogDefaults.tipos.vaso.descripcion,
      imagen: catalogDefaults.tipos.vaso.imagen,
      disponible: true
    },
    {
      nombre: 'barquillo',
      descripcion: catalogDefaults.tipos.barquillo.descripcion,
      imagen: catalogDefaults.tipos.barquillo.imagen,
      disponible: true
    },
    {
      nombre: 'canasta',
      descripcion: catalogDefaults.tipos.canasta.descripcion,
      imagen: catalogDefaults.tipos.canasta.imagen,
      disponible: true
    }
  ],
  toppings: [
    {
      nombre: 'chispas',
      precioExtra: 5,
      descripcion: catalogDefaults.toppings.chispas.descripcion,
      imagen: catalogDefaults.toppings.chispas.imagen,
      disponible: true
    },
    {
      nombre: 'gomitas',
      precioExtra: 7,
      descripcion: catalogDefaults.toppings.gomitas.descripcion,
      imagen: catalogDefaults.toppings.gomitas.imagen,
      disponible: true
    },
    {
      nombre: 'oreo triturada',
      precioExtra: 8,
      descripcion: catalogDefaults.toppings['oreo triturada'].descripcion,
      imagen: catalogDefaults.toppings['oreo triturada'].imagen,
      disponible: true
    },
    {
      nombre: 'cajeta',
      precioExtra: 6,
      descripcion: catalogDefaults.toppings.cajeta.descripcion,
      imagen: catalogDefaults.toppings.cajeta.imagen,
      disponible: true
    },
    {
      nombre: 'nuez',
      precioExtra: 10,
      descripcion: catalogDefaults.toppings.nuez.descripcion,
      imagen: catalogDefaults.toppings.nuez.imagen,
      disponible: true
    },
    {
      nombre: 'chocolate liquido',
      precioExtra: 6,
      descripcion: catalogDefaults.toppings['chocolate liquido'].descripcion,
      imagen: catalogDefaults.toppings['chocolate liquido'].imagen,
      disponible: true
    }
  ],
  servicios: [
    {
      nombre: 'paletas',
      descripcion: 'Paletas de agua y leche',
      imagen: catalogDefaults.servicios.paletas.imagen,
      disponible: true
    },
    {
      nombre: 'malteadas',
      descripcion: 'Malteadas preparadas al momento',
      imagen: catalogDefaults.servicios.malteadas.imagen,
      disponible: true
    },
    {
      nombre: 'postres frios',
      descripcion: 'Postres frios para compartir',
      imagen: catalogDefaults.servicios['postres frios'].imagen,
      disponible: true
    },
    {
      nombre: 'entrega a domicilio',
      descripcion: 'Servicio sujeto a zona',
      imagen: catalogDefaults.servicios['entrega a domicilio'].imagen,
      disponible: true
    },
    {
      nombre: 'helado vegano',
      descripcion: 'Opciones sin lacteos',
      imagen: catalogDefaults.servicios['helado vegano'].imagen,
      disponible: true
    }
  ]
};

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '').trim();

  if (token !== API_TOKEN) {
    return res.status(401).json({
      ok: false,
      error: 'Token invalido o ausente'
    });
  }

  next();
}

function clean(doc) {
  const { _id, ...rest } = doc;
  return rest;
}

function enrichCatalogItem(collection, doc) {
  const base = clean(doc);
  const defaults = catalogDefaults[collection] || {};
  const fallback = defaults[normalizar(base.nombre)] || {};

  return {
    ...base,
    descripcion: base.descripcion || fallback.descripcion,
    imagen: base.imagen || fallback.imagen
  };
}

function enrichCatalogList(collection, docs) {
  return (docs || []).map((doc) => enrichCatalogItem(collection, doc));
}

async function seedIfEmpty() {
  for (const [collection, docs] of Object.entries(seed)) {
    const count = await db.collection(collection).countDocuments();

    if (count === 0) {
      await db.collection(collection).insertMany(
        docs.map((doc) => ({
          ...doc,
          createdAt: new Date()
        }))
      );

      console.log(`Coleccion '${collection}' inicializada con datos.`);
    }
  }
}

async function backfillMissingCatalogFields() {
  for (const collection of Object.keys(catalogDefaults)) {
    const docs = await db.collection(collection).find({}).toArray();

    for (const doc of docs) {
      const fallback = catalogDefaults[collection][normalizar(doc.nombre)];

      if (!fallback) {
        continue;
      }

      const patch = {};

      if (!doc.descripcion && fallback.descripcion) {
        patch.descripcion = fallback.descripcion;
      }

      if (!doc.imagen && fallback.imagen) {
        patch.imagen = fallback.imagen;
      }

      if (Object.keys(patch).length > 0) {
        await db.collection(collection).updateOne(
          { _id: doc._id },
          {
            $set: patch
          }
        );
      }
    }
  }
}

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Bienvenido a la API de Helados Nevados',
    endpoints: [
      'GET /api/health',
      'GET /api/catalogo',
      'GET /api/recomendacion?preferencia=chocolate',
      'POST /api/pedidos'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'Helados Nevados API',
    database: db ? 'conectada' : 'no conectada'
  });
});

app.get('/api/catalogo', auth, async (req, res) => {
  try {
    const [sabores, tamanos, tipos, toppings, servicios] = await Promise.all([
      db.collection('sabores').find({ disponible: true }).sort({ popularidad: -1 }).toArray(),
      db.collection('tamanos').find({ disponible: true }).toArray(),
      db.collection('tipos').find({ disponible: true }).toArray(),
      db.collection('toppings').find({ disponible: true }).toArray(),
      db.collection('servicios').find({ disponible: true }).toArray()
    ]);

    res.json({
      ok: true,
      sabores: sabores.map(clean),
      tamanos: enrichCatalogList('tamanos', tamanos),
      tipos: enrichCatalogList('tipos', tipos),
      toppings: enrichCatalogList('toppings', toppings),
      servicios: enrichCatalogList('servicios', servicios)
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Error al obtener catalogo',
      detalle: error.message
    });
  }
});

app.get('/api/recomendacion', auth, async (req, res) => {
  try {
    const preferenciaOriginal = String(req.query.preferencia || '').trim();
    const preferencia = normalizar(preferenciaOriginal);

    const sabores = await db
      .collection('sabores')
      .find({ disponible: true })
      .sort({ popularidad: -1 })
      .toArray();

    if (sabores.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'No hay sabores disponibles'
      });
    }

    const elegido =
      sabores.find((sabor) => normalizar(`${sabor.nombre} ${sabor.descripcion}`).includes(preferencia)) ||
      sabores[0];

    res.json({
      ok: true,
      sabor: elegido.nombre,
      razon: `Tiene alta popularidad (${elegido.popularidad}/100) y coincide con la preferencia '${preferenciaOriginal || 'popular'}'.`,
      imagen: elegido.imagen
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Error al generar recomendacion',
      detalle: error.message
    });
  }
});

app.post('/api/pedidos', auth, async (req, res) => {
  try {
    const { tamano, sabor, tipo, topping, total, canal } = req.body;

    if (!tamano || !sabor || !tipo || !topping) {
      return res.status(400).json({
        ok: false,
        error: 'Pedido incompleto. Debes enviar tamano, sabor, tipo y topping.'
      });
    }

    const folio = `HN-${Date.now().toString().slice(-6)}`;
    const pedido = {
      folio,
      tamano,
      sabor,
      tipo,
      topping,
      total: Number(total || 0),
      canal: canal || 'Alexa',
      estado: 'recibido',
      createdAt: new Date()
    };

    await db.collection('pedidos').insertOne(pedido);

    res.status(201).json({
      ok: true,
      message: 'Pedido registrado correctamente',
      folio,
      pedido: clean(pedido)
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Error al registrar pedido',
      detalle: error.message
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Ruta no encontrada'
  });
});

async function start() {
  if (!MONGODB_URI) {
    throw new Error('Configura MONGODB_URI en el archivo .env');
  }

  console.log('Intentando conectar a MongoDB Atlas...');

  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000
  });

  await client.connect();
  db = client.db(DB_NAME);

  console.log('Conectado correctamente a MongoDB Atlas');
  console.log(`Base de datos activa: ${DB_NAME}`);

  await seedIfEmpty();
  await backfillMissingCatalogFields();

  app.listen(PORT, () => {
    console.log(`Helados Nevados API ejecutandose en http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Error al iniciar el servidor:');
  console.error(error);
  process.exit(1);
});
