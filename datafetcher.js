let accessToken = null; // Declare globally

function loginAndGetToken() {
    // Your login logic remains the same
    // Check if access token already exists in localStorage or session
  if (accessToken) {
    console.log('Using existing access token:', accessToken);
    return Promise.resolve(accessToken); // Return the cached token
  }

  return fetch('/login', { // Make request to your local server
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ /* username/password if needed */ })
  })
  .then(response => response.json())
  .then(data => {
    if (data.accessKey) {
      console.log('Login Successful, Access Key:', data.accessKey);
      accessToken = data.accessKey; // Store the token in memory
      return accessToken; 
    } else {
      throw new Error('Login failed, no access key returned.');
    }
  })
  .catch(error => {
    console.error('Error during login:', error);
    throw error; 
  }); 
}

function findByCriteria(accessKey) {
    const column = document.getElementById("column").value; // Ensure this element is accessible
    const operator = document.getElementById("operator").value;
    const value = document.getElementById("value").value;

    // Ensure these values exist before using them
    if (!column || !operator || !value) {
        console.error("One or more filter fields are empty.");
        return;
    }

    const payload = {
        "pageSize": "100",
        "pageNumber": "0",
        "name": {
            "value": value,
            "operator": operator 
        }
    };

    return fetch('/find-by-criteria', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accessKey, payload })
    })
    .then(response => response.json())
    .then(data => {
        // Your data handling logic
        const promotionName = data.promotionName;
    const itemCodes = data.itemCodes; // Notice it's plural, as per the backend

    console.log("PROMO: ", promotionName);
    console.log("itemCodes: ", itemCodes);

    // Store values in local storage
    localStorage.setItem('promotionName', promotionName);
    localStorage.setItem('itemCodes', JSON.stringify(itemCodes)); // store as JSON since it's an array

    console.log('Success:', data);
    return data;  
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Wait for the DOM to load before adding event listeners
document.addEventListener('DOMContentLoaded', () => {
    const findByCriteriaBtn = document.getElementById("findByCriteriaBtn");
    if (findByCriteriaBtn) {
        findByCriteriaBtn.addEventListener("click", function () {
            loginAndGetToken().then(accessKey => {
                findByCriteria(accessKey);
            })
            .catch(error => {
                console.error('Unable to proceed due to login failure:', error);
            });
        });
    }

    const removeAllBtn = document.getElementById("removeAllBtn");
    if (removeAllBtn) {
        removeAllBtn.addEventListener("click", function () {
            document.getElementById("column").selectedIndex = 0;
            document.getElementById("operator").selectedIndex = 0;
            document.getElementById("value").value = "";
            localStorage.removeItem('promotionName');
            localStorage.removeItem('itemCodes');
        });
    }
});
