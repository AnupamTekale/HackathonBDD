import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';

const app = express();
const port = 3001; 

const staticPath = path.join('G:', 'NCR HACK');
app.use(express.static(staticPath));
app.use(cors()); 
app.use(express.json()); 

// Default route to serve login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(staticPath, 'login.html')); 
});

// Serve the background image
app.get('/bg1.jpg', (req, res) => {
  res.sendFile(path.join(staticPath, 'bg1.jpg'));
});

// Serve the bddbuilder.html
app.get('/bddbuilder', (req, res) => {
  res.sendFile(path.join(staticPath, 'bddbuilder.html'));
});

const basicAuth = 'Basic YWNjdDpsb3lhbHR5LXNpdC10ZXN0QG1wMTg1Mzg4OlNhdHlhc3JpQDI2OTQ=';

// Login route
app.post('/login', async (req, res) => {
  try {
    const currentTime = new Date().toUTCString(); 

    const response = await fetch('https://gateway-dev-x.ncrcloud.com/security/authentication/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'date': currentTime,
        'nep-organization': 'loyalty-sit-test',
        'Authorization': basicAuth
      }
    });

    const data = await response.json();
    if (data.token) {
      res.json({ accessKey: data.token });
    } else {
      res.status(401).json({ error: 'Login failed' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/find-by-criteria', async (req, res) => {
  try {
    const { accessKey, payload } = req.body;
    const currentTime = new Date().toUTCString(); 

    const response = await fetch('https://gateway-dev-x.ncrcloud.com/ret-promotions/v1/promotions/find-by-criteria', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `AccessToken ${accessKey}`,
        'date': currentTime,
        'nep-organization': 'loyalty-sit-test'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Check if pageContent exists and is not empty
    if (!data.pageContent || data.pageContent.length === 0) {
      return res.status(404).json({ error: 'No promotion data found' });
    }

    const promotionName = data.pageContent[0].name;

    // Ensure conditions and items exist before accessing
    const includedItemGroupIdsConditions = data.pageContent[0].conditions?.items?.flatMap(item => item.includedItemGroupIds) || [];
    console.log("Included Item Group IDs from Conditions:", includedItemGroupIdsConditions);

    if (includedItemGroupIdsConditions.length > 0) {
      const apiResponse = await fetch(`https://gateway-dev-x.ncrcloud.com/ret-grouping/v1/groups/attributes?groupId=${includedItemGroupIdsConditions[0]}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `AccessToken ${accessKey}`,
          'date': currentTime,
          'nep-organization': 'loyalty-sit-test'
        }
      });

      const apiData = await apiResponse.json();
      console.log('API with includedItemGroupIds response:', apiData);

      const itemCodes = apiData.pageContent
        ?.map(item => item.value)
        .filter(value => value !== undefined && value !== null) || [];

      console.log("ITEMCODE: ", itemCodes);

      res.json({ promotionName, itemCodes });
    } else {
      res.status(404).json({ error: 'No includedItemGroupIds found in the promotion data' });
    }
  } catch (error) {
    console.error('Error in find-by-criteria:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
