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
  chocolate: 'https://babyshowerchocolate.com/cdn/shop/articles/chocolate_hero1-d62e5444a8734f8d8fe91f5631d51ca5.jpg?v=1694433941&width=714',
  fresa: 'https://www.finedininglovers.es/sites/default/files/styles/1_1_768x768/public/article_content_images/fresas%C2%A9iStock.jpg.webp?itok=i5qzAQ1_',
  oreo: 'https://www.pediatriamildias.com/wp-content/uploads/2022/09/Blog53.jpg',
  vainilla: 'https://panyoli.com.mx/images/transportar_pastel_vainilla.jpg',
  menta: 'https://www.eluniverso.com/resizer/v2/JPXZJSC36RH6RD4IV53LPWNR3E.jpg?auth=4b6d0292783c55134d6388dab4356202c18f59ea3bfd69aacc90b9dc3b1ba71e&width=1191&height=670&quality=75&smart=true',
  frutosRojos: 'https://hidromielzangana.com/wp-content/uploads/2023/06/frutos-rojos-768x402.jpg',
  tamanoChico: 'https://gmz.ltd/wp-content/uploads/2024/09/A-Quick-Guide-to-Standard-Ice-Cream-Cup-Sizes-in-oz-and-ml-GMZ-768x768.webp',
  tamanoMediano: 'https://media-cdn.tripadvisor.com/media/photo-s/0b/31/b2/3f/helado-mediano-dos-sabores.jpg',
  tamanoGrande: 'https://www.honokage.com/wp-content/uploads/2024/11/Ice-Cream-Container-Sizes-768x432.jpg',
  tamanoFamiliar: 'https://amarket.com.bo/cdn/shop/files/7771224005777_646x646.jpg?v=1712345219',
  cono: 'https://granvita.com/wp-content/uploads/2018/08/recetas_conosavena_Granvita-1536x804-1.jpg',
  vaso: 'https://http2.mlstatic.com/D_NQ_NP_810893-MLM106763272062_022026-O.webp',
  barquillo: 'https://www.grupochantilly.com.mx/wp-content/uploads/2023/07/Barquillo-unicornio-768x675.png',
  canasta: 'https://restauranteinsignia.com/wp-content/uploads/2025/05/Canasta-waffle-helado.jpg',
  chispas: 'https://verditia.com/wp-content/uploads/2020/03/chispas-de-chocolate.jpg',
  gomitas: 'https://i0.wp.com/foodandwineespanol.com/wp-content/uploads/2021/09/gomitas.webp?fit=2560%2C1440&ssl=1',
  cajeta: 'https://sabroso.mx/wp-content/uploads/2025/08/Cajeta-de-Celaya-768x438.jpg',
  nuez: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Walnuts_-_whole_and_open_with_halved_kernel.jpg',
  chocolateLiquido: 'https://colday.com.mx/cdn/shop/articles/ac9c4b2ee54cce69d6189f9a1a43cf0d_ddbfb4c4-5bca-49d5-9839-c274da74ea02_720x.jpg?v=1773155360',
  malteada: 'https://cdn7.kiwilimon.com/recetaimagen/3666/640x426/10613.jpg.webp',
  paletas: 'https://images.cookforyourlife.org/wp-content/uploads/2015/08/shutterstock_451717216-768x512.jpg',
  postre: 'https://www.cocinavital.mx/wp-content/uploads/2018/02/postres_vasitos.jpg',
  delivery: 'https://media.istockphoto.com/id/1221101939/es/foto/concepto-de-entrega-asian-man-mano-aceptando-una-entrega-de-cajas-de-reparto-de-repartidor.jpg?s=1024x1024&w=is&k=20&c=EEhKFD_9dR2NIGgU0lJBuUZE6-QEjza4i922Dv28iw4=',
  vegano: 'https://jappi.com.co/wp-content/uploads/2021/01/como-preparar-helado-vegano-imagen-destacada.jpg'
};

const catalogDefaults = {
  tamanos: {
    chico: {
      descripcion: '$25 | Porcion individual',
      imagen: DEFAULT_IMAGES.tamanoChico
    },
    mediano: {
      descripcion: '$35 | El favorito de la casa',
      imagen: DEFAULT_IMAGES.tamanoMediano
    },
    grande: {
      descripcion: '$45 | Doble antojo',
      imagen: DEFAULT_IMAGES.tamanoGrande
    },
    familiar: {
      descripcion: '$95 | Para compartir',
      imagen: DEFAULT_IMAGES.tamanoFamiliar
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
      imagen: DEFAULT_IMAGES.barquillo
    },
    canasta: {
      descripcion: 'Formato especial para postre premium.',
      imagen: DEFAULT_IMAGES.canasta
    }
  },
  toppings: {
    chispas: {
      descripcion: 'Extra $5 | Toque divertido de color.',
      imagen: DEFAULT_IMAGES.chispas
    },
    gomitas: {
      descripcion: 'Extra $7 | Dulce y suave.',
      imagen: DEFAULT_IMAGES.gomitas
    },
    'oreo triturada': {
      descripcion: 'Extra $8 | Galleta crujiente sobre crema.',
      imagen: DEFAULT_IMAGES.oreo
    },
    cajeta: {
      descripcion: 'Extra $6 | Dulzor tradicional.',
      imagen: DEFAULT_IMAGES.cajeta
    },
    nuez: {
      descripcion: 'Extra $10 | Aroma tostado y textura premium.',
      imagen: DEFAULT_IMAGES.nuez
    },
    'chocolate liquido': {
      descripcion: 'Extra $6 | Salsa intensa y brillante.',
      imagen: DEFAULT_IMAGES.chocolateLiquido
    }
  },
  servicios: {
    paletas: {
      imagen: DEFAULT_IMAGES.paletas
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
      imagen: DEFAULT_IMAGES.vegano
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
