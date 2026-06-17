require('dotenv').config();

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN || 'dev-token-helados';
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'helados_nevados';

let db;

const seed = {
  sabores: [
    {
      nombre: 'chocolate',
      descripcion: 'Clásico cremoso con cacao',
      precioExtra: 0,
      imagen: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80',
      popularidad: 98,
      disponible: true
    },
    {
      nombre: 'fresa',
      descripcion: 'Fresco y frutal',
      precioExtra: 0,
      imagen: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=900&q=80',
      popularidad: 91,
      disponible: true
    },
    {
      nombre: 'oreo',
      descripcion: 'Cremoso con galleta',
      precioExtra: 5,
      imagen: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=900&q=80',
      popularidad: 95,
      disponible: true
    },
    {
      nombre: 'vainilla',
      descripcion: 'Suave y tradicional',
      precioExtra: 0,
      imagen: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=900&q=80',
      popularidad: 87,
      disponible: true
    },
    {
      nombre: 'menta',
      descripcion: 'Refrescante con toque dulce',
      precioExtra: 4,
      imagen: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?auto=format&fit=crop&w=900&q=80',
      popularidad: 82,
      disponible: true
    },
    {
      nombre: 'frutos rojos',
      descripcion: 'Mezcla de frutos del bosque',
      precioExtra: 6,
      imagen: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=900&q=80',
      popularidad: 89,
      disponible: true
    }
  ],

  tamanos: [
    { nombre: 'chico', precio: 25, disponible: true },
    { nombre: 'mediano', precio: 35, disponible: true },
    { nombre: 'grande', precio: 45, disponible: true },
    { nombre: 'familiar', precio: 95, disponible: true }
  ],

  tipos: [
    { nombre: 'cono', disponible: true },
    { nombre: 'vaso', disponible: true },
    { nombre: 'barquillo', disponible: true },
    { nombre: 'canasta', disponible: true }
  ],

  toppings: [
    { nombre: 'chispas', precioExtra: 5, disponible: true },
    { nombre: 'gomitas', precioExtra: 7, disponible: true },
    { nombre: 'oreo triturada', precioExtra: 8, disponible: true },
    { nombre: 'cajeta', precioExtra: 6, disponible: true },
    { nombre: 'nuez', precioExtra: 10, disponible: true },
    { nombre: 'chocolate líquido', precioExtra: 6, disponible: true }
  ],

  servicios: [
    {
      nombre: 'paletas',
      descripcion: 'Paletas de agua y leche',
      disponible: true
    },
    {
      nombre: 'malteadas',
      descripcion: 'Malteadas preparadas al momento',
      disponible: true
    },
    {
      nombre: 'postres fríos',
      descripcion: 'Postres fríos para compartir',
      disponible: true
    },
    {
      nombre: 'entrega a domicilio',
      descripcion: 'Servicio sujeto a zona',
      disponible: true
    },
    {
      nombre: 'helado vegano',
      descripcion: 'Opciones sin lácteos',
      disponible: true
    }
  ]
};

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '').trim();

  if (token !== API_TOKEN) {
    return res.status(401).json({
      ok: false,
      error: 'Token inválido o ausente'
    });
  }

  next();
}

function clean(doc) {
  const { _id, ...rest } = doc;
  return rest;
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

      console.log(`Colección '${collection}' inicializada con datos.`);
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
      tamanos: tamanos.map(clean),
      tipos: tipos.map(clean),
      toppings: toppings.map(clean),
      servicios: servicios.map(clean)
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Error al obtener catálogo',
      detalle: error.message
    });
  }
});

app.get('/api/recomendacion', auth, async (req, res) => {
  try {
    const preferencia = String(req.query.preferencia || '').toLowerCase();

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
      sabores.find((sabor) =>
        `${sabor.nombre} ${sabor.descripcion}`
          .toLowerCase()
          .includes(preferencia)
      ) || sabores[0];

    res.json({
      ok: true,
      sabor: elegido.nombre,
      razon: `Tiene alta popularidad (${elegido.popularidad}/100) y coincide con la preferencia '${preferencia || 'popular'}'.`,
      imagen: elegido.imagen
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Error al generar recomendación',
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

  app.listen(PORT, () => {
    console.log(`Helados Nevados API ejecutándose en http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Error al iniciar el servidor:');
  console.error(error);
  process.exit(1);
});