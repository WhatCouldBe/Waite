Before running locally for testing

npm install

then 
cd server
npm start


and then

cd client
npm install
npm start

If using locally:
Replace client\package.json with the following:
{
  "name": "bacshots-client",
  "version": "1.0.0",
  "private": true,
  "proxy": "http://localhost:4000",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.2",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "eslint-plugin-react-hooks": "^5.1.0"
  }
}
