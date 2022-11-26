const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0nty043.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoriesCollection = client.db('bookBazzar').collection('categories');
        const booksCollection = client.db('bookBazzar').collection('books');
        const ordersCollection = client.db('bookBazzar').collection('orders');
        const usersCollection = client.db('bookBazzar').collection('users');

        app.get('/categories', async (req, res) => {
            const query = {}
            const cursor = categoriesCollection.find(query);
            const categories = await cursor.toArray();
            res.send(categories);
        });

        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const categories = await categoriesCollection.findOne(query);
            res.send(categories);
        });

        app.get('/books', async (req, res) => {
            let query = {};

            if (req.query.category_id) {
                query = {
                    category_id: req.query.category_id
                }
            }

            const cursor = await booksCollection.find(query);
            const books = await cursor.toArray();
            res.send(books);
        });

        app.get('/orders', async (req, res) => {
            const email = req.query.email;

            const query = { email: email };
            const order = await ordersCollection.find(query).toArray();
            res.send(order);
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
    }
    finally {

    }
}

run().catch(err => console.error(err));


app.get('/', async (req, res) => {
    res.send('Book Bazzar Server is Running...');
})

app.listen(port, () => console.log(`Book Bazzar Server is Running on ${port}`))