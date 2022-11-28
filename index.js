const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0nty043.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        const categoriesCollection = client.db('bookBazzar').collection('categories');
        const booksCollection = client.db('bookBazzar').collection('books');
        const ordersCollection = client.db('bookBazzar').collection('orders');
        const usersCollection = client.db('bookBazzar').collection('users');

        //categories

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

        //books

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

        app.get('/books/mybooks', async (req, res) => {
            const name = req.query.name;
            const query = { seller_name: name };
            const book = await booksCollection.find(query).toArray();
            res.send(book);
        })

        app.post('/books', async (req, res) => {
            const book = req.body;
            const result = await booksCollection.insertOne(book);
            res.send(result);
        });

        //orders

        app.get('/orders', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            const query = { email: email };
            const order = await ordersCollection.find(query).toArray();
            res.send(order);
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        });

        //jwt

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' })
                return res.send({ accessToken: token });
            }
            return res.status(403).send({ accessToken: '' })
        });

        //users

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'buyer' });
        })

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        })

        app.get('/buyer-users', async (req, res) => {
            const query = { role: 'buyer' };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/seller-users', async (req, res) => {
            const query = { role: 'seller' };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.put('/users', async (req, res) => {
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