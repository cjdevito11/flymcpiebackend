const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up AWS S3
const s3 = new AWS.S3({
  accessKeyId: 'YOUR_ACCESS_KEY_ID',
  secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
  region: 'YOUR_REGION',
});

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

// Upload endpoint
app.post('/api/upload', upload.array('files'), async (req, res) => {
  const { name, peopleNames, location } = req.body;
  const files = req.files;

  try {
    for (const file of files) {
      const params = {
        Bucket: 'YOUR_BUCKET_NAME',
        Key: file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          'x-amz-meta-name': name,
          'x-amz-meta-peopleNames': peopleNames,
          'x-amz-meta-location': location,
        },
      };
      await s3.upload(params).promise();
    }
    res.status(200).send('Files uploaded successfully');
  } catch (error) {
    res.status(500).send('Error uploading files');
  }
});

// Fetch images endpoint
app.get('/api/images', async (req, res) => {
  try {
    const params = {
      Bucket: 'YOUR_BUCKET_NAME',
    };
    const data = await s3.listObjectsV2(params).promise();
    const urls = data.Contents.map(item => `https://${params.Bucket}.s3.amazonaws.com/${item.Key}`);
    res.json({ urls });
  } catch (error) {
    res.status(500).send('Error fetching images');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
