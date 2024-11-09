// index.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(cors()); // Habilita CORS

app.use(bodyParser.json());

//Cargar el json de productos
let products;
fs.readFile('./products.json', 'utf-8', (err, data) => {
  if (err) {
    console.error("Error al leer el archivo de productos:", err);
    return;
  }
  products = JSON.parse(data).products;
});

//Cargar el json de ventas
let sales;
fs.readFile('./sales.json', 'utf-8', (err, data) => {
  if (err) {
    console.error("Error al leer el archivo de ventas:", err);
    return;
  }
  sales = JSON.parse(data).sales;
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Hola, mundo desde un servidor Express!');
});

//Endpoint para obtener todos los productos
app.get('/api/items', (req, res) => {
  const query = req.query.q?.toLowerCase() || ''; //Obtener y convertir a minúsculas para evitar problemas de mayúsculas
  const filteredItems = products.filter(product => 
    product.title.toLowerCase().includes(query) || 
    product.description.toLowerCase().includes(query)
  );
  res.json(filteredItems)
});

//Endpoint para obtener todas las ventas
app.get('/api/sales', (req, res) => {
  const query = req.query.q?.toLowerCase() || '';
  const filteredSales = sales.filter(sale => 
    sale.title.toLowerCase().includes(query) || 
    sale.description.toLowerCase().includes(query)
  );
  res.json(filteredSales)
});

//Endpoint para buscar productos por su nombre
app.get('/api/items', (req, res) => {
  const searchQuery = req.query.search?.toLowerCase() || '';
  
  const filteredItems = products.filter(product => 
    product.title.toLowerCase().includes(searchQuery)
  );
  
  res.json({
    count: filteredItems.length,
    results: filteredItems.map(product => ({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      rating: product.rating
    }))
  });
});

// Endpoint para obtener un producto por su ID
app.get('/api/items/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10); // Convertir el ID a un número entero
  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  res.json({
    title: product.title,
    description: product.description,
    price: product.price,
    category: product.category,
    image: product.image,
    rating: product.rating,
    stock: product.stock
  });
});


//Registrar una venta
app.post('/api/addSale', (req, res) => {
  const { productId } = req.body;

  const product = products.find(p => p.id === productId);
  if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
  }
  if (product.stock === 0) {
      return res.status(400).json({ error: 'Producto agotado'   
});
  }

  //Fecha y hora de la compra
  const currentDate = new Date().toISOString();

  //Crear un nuevo objeto de venta
  const newSale = {
      id: sales.length + 1,
      ProductId: productId,
      title: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      rating: product.rating,
      lot: 1,
      image: product.image,
      saleDate: currentDate
  };

  product.stock--;

  fs.writeFile('./products.json', JSON.stringify({ products }), (err) => {
      if (err) {
          console.error('Error al escribir el archivo de productos:', err);
          return res.status(500).json({ error: 'Error interno del servidor' });
      }
      fs.writeFile('./sales.json', JSON.stringify({ sales: [...sales, newSale] }), (err) => {
          if (err) {
              console.error('Error al escribir el archivo de ventas:', err);
              return res.status(500).json({ error: 'Error interno del servidor' });
          }
          res.json({ message: 'Venta registrada correctamente', sale: newSale });
      });
  });
});


//Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
