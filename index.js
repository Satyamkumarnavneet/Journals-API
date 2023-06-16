const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: '5432',
    user: 'postgres',
    password: 'Supriya62@',
    database: 'journal',
  },
});

const app = express();
app.use(bodyParser.json());

// Generate secret key
const JWT_SECRET = crypto.randomBytes(32).toString('hex');

function isValidCredentials(username, password) {
  const users = [
    { id: 1, username: 'Anum', password: 'admin198', role: 'teacher' },
    { id: 2, username: 'Rasshi', password: 'Rasshi62@', role: 'teacher' },
    { id: 3, username: 'Ishaan', password: 'pass123', role: 'student' },
    { id: 4, username: 'Amrit', password: 'Password1231', role: 'student'},
    { id: 5, username: 'Satyam', password: 'Saatuu123', role: 'student'},
  ];

  const user = users.find((user) => user.username === username && user.password === password);

  if (user) {
    return true;
  }
  return false;
}

// verifyToken() 
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const cache = new Map();
  if (cache.has(token)) {
    req.user = cache.get(token);
    next();
  } else {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      cache.set(token, decoded);
      req.user = decoded;
      next();
    });
  }
}
// login()
app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
  
    if (!isValidCredentials(username, password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
  
    const token = jwt.sign({ username }, JWT_SECRET);
    return res.json({ token });
  });
  
// createJournal()
app.post('/journals', verifyToken, async (req, res) => {
  const { description, taggedStudents, attachment } = req.body;
  const publishedAt = new Date();

  const result = await knex('journals')
    .insert({ description, taggedStudents, attachment, publishedAt });

  if (result.rowCount === 1) {
    res.json({ message: 'Journal created' });
  } else {
    res.status(500).json({ error: 'Failed to create journal' });
  }
});

// updateJournal() 
app.put('/journals/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { description, taggedStudents, attachment } = req.body;

  const result = await knex('journals')
    .where({ id })
    .update({ description, taggedStudents, attachment });

  if (result.rowCount === 1) {
    res.json({ message: 'Journal updated' });
  } else {
    res.status(500).json({ error: 'Failed to update journal' });
  }
});

// deleteJournal() 
app.delete('/journals/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  const result = await knex('journals')
    .where({ id })
    .del();

  if (result.rowCount === 1) {
    res.json({ message: 'Journal deleted' });
  } else {
    res.status(500).json({ error: 'Failed to delete journal' });
  }
});

// publishJournal() 
app.post('/journals/:id/publish', verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await knex('journals')
    .where({ id })
    .update({ publishedAt: new Date() });

  if (result.rowCount === 1) {
    res.json({ message: 'Journal published' });
  } else {
    res.status(500).json({ error: 'Failed to publish journal' });
  }
});

// getJournalsTeacher() 
app.get('/journals/teacher', verifyToken, async (req, res) => {
  const { id } = req.user;

  const result = await knex('journals')
    .where({ teacherId: id });

  res.json({ journals: result });
});

// getJournalsStudent() 
app.get('/journals/student', verifyToken, async (req, res) => {
  const { id } = req.user;

  const result = await knex('journals')
    .whereRaw('? = ANY (taggedStudents)', [id]);

  res.json({ journals: result });
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

app.get('/', (req, res) => {
  res.send('Welcome to the Journal API!');
});